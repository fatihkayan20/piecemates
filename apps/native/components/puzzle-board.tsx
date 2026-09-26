import {
	apply,
	type ClientMsg,
	generate,
	isComplete,
	type Player,
	piecePath,
	type ServerMsg,
	type State,
} from "@puzzle/game";
import {
	Canvas,
	Group,
	Image,
	Path,
	Rect,
	type SkImage,
	Skia,
	type SkPath,
	useImage,
} from "@shopify/react-native-skia";
import { useEffect, useReducer, useRef, useState } from "react";
import { type LayoutChangeEvent, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { authHeaders, type RoomInfo, roomSocketUrl } from "@/lib/api";

type Status = "connecting" | "playing" | "done" | "disconnected";
type Drag = { piece: number; members: Set<number> };

export function PuzzleBoard({ room }: { room: RoomInfo }) {
	const image = useImage(room.imageUrl);
	const insets = useSafeAreaInsets();
	const [, rerender] = useReducer((n: number) => n + 1, 0);
	const [players, setPlayers] = useState<Player[]>([]);
	const [status, setStatus] = useState<Status>("connecting");
	const [drag, setDrag] = useState<Drag | null>(null);

	const state = useRef<State | null>(null);
	const me = useRef("");
	const ws = useRef<WebSocket | null>(null);
	const order = useRef<number[]>([]); // draw order, last = on top
	const size = useRef({ width: 0, height: 0 });
	const target = useRef<number | null>(null);
	const dragRef = useRef<Drag | null>(null);
	dragRef.current = drag;

	// Camera: screen = t + s * world. Dragged group: world offset.
	const tx = useSharedValue(0);
	const ty = useSharedValue(0);
	const sc = useSharedValue(1);
	const dx = useSharedValue(0);
	const dy = useSharedValue(0);
	const camera = useDerivedValue(() => [
		{ translateX: tx.value },
		{ translateY: ty.value },
		{ scale: sc.value },
	]);
	const dragOffset = useDerivedValue(() => [
		{ translateX: dx.value },
		{ translateY: dy.value },
	]);

	const paths = useRef<SkPath[]>([]).current;

	const send = (msg: ClientMsg) => {
		if (ws.current?.readyState === WebSocket.OPEN)
			ws.current.send(JSON.stringify(msg));
	};

	const fit = (s: State) => {
		const { width, height } = size.current;
		if (!width) return;
		const xs = s.pieces.map((p) => p.x);
		const ys = s.pieces.map((p) => p.y);
		const minX = Math.min(0, ...xs);
		const minY = Math.min(0, ...ys);
		const bw = Math.max(s.cols * s.w, ...xs.map((x) => x + s.w)) - minX;
		const bh = Math.max(s.rows * s.h, ...ys.map((y) => y + s.h)) - minY;
		const scale = Math.min(width / bw, height / bh) * 0.9;
		sc.value = scale;
		tx.value = (width - bw * scale) / 2 - minX * scale;
		ty.value = (height - bh * scale) / 2 - minY * scale;
	};

	const endDrag = () => {
		setDrag(null);
		dx.value = 0;
		dy.value = 0;
	};

	useEffect(() => {
		let closed = false;
		void authHeaders().then((headers) => {
			if (closed) return;
			// React Native's WebSocket accepts headers as a third argument.
			const socket = new (
				WebSocket as unknown as new (
					url: string,
					protocols: undefined,
					opts: { headers: Record<string, string> },
				) => WebSocket
			)(roomSocketUrl(room.code), undefined, { headers });
			ws.current = socket;
			connect(socket);
		});
		return () => {
			closed = true;
			ws.current?.close();
		};
	}, [room]);

	const connect = (socket: WebSocket) => {
		socket.onclose = () => setStatus("disconnected");
		socket.onmessage = (ev) => {
			const msg = JSON.parse(ev.data) as ServerMsg;
			if (msg.type === "state") {
				const first = !state.current;
				state.current = msg.state;
				me.current = msg.you;
				if (paths.length === 0) {
					const edges = generate(room.seed, msg.state.rows, msg.state.cols);
					for (const e of edges) {
						paths.push(
							Skia.Path.MakeFromSVGString(
								piecePath(e, msg.state.w, msg.state.h),
							) as SkPath,
						);
					}
					order.current = edges.map((_, i) => i);
				}
				if (first) fit(msg.state);
				setStatus(isComplete(msg.state) ? "done" : "playing");
			} else if (msg.type === "applied" && state.current) {
				apply(state.current, msg.by, msg.msg);
				const d = dragRef.current;
				if (
					msg.by === me.current &&
					msg.msg.type === "drop" &&
					d?.piece === msg.msg.piece
				)
					endDrag();
				if (msg.msg.type === "drop" && isComplete(state.current))
					setStatus("done");
			} else if (msg.type === "rejected") {
				if (msg.msg.type === "lock" || msg.msg.type === "drop") endDrag();
			} else if (msg.type === "presence") {
				setPlayers(msg.players);
			}
			rerender();
		};
	};

	const hitTest = (x: number, y: number) => {
		const s = state.current;
		if (!s) return null;
		const wx = (x - tx.value) / sc.value;
		const wy = (y - ty.value) / sc.value;
		for (let k = order.current.length - 1; k >= 0; k--) {
			const i = order.current[k] as number;
			const p = s.pieces[i];
			if (!p || p.bag !== null) continue;
			const holder = s.locks[p.group];
			if (holder !== undefined && holder !== me.current) continue;
			if (paths[i]?.contains(wx - p.x, wy - p.y)) return i;
		}
		return null;
	};

	// ponytail: gestures run on the JS thread; move to worklets if drag stutters at 1000 pieces.
	const pan = Gesture.Pan()
		.runOnJS(true)
		.maxPointers(1)
		.onBegin((e) => {
			target.current = dragRef.current ? null : hitTest(e.x, e.y);
		})
		.onStart(() => {
			const s = state.current;
			const i = target.current;
			if (!s || i === null) return;
			const group = s.pieces[i]?.group;
			const members = new Set(
				s.pieces.flatMap((q, j) => (q.group === group ? [j] : [])),
			);
			order.current = [
				...order.current.filter((j) => !members.has(j)),
				...members,
			];
			dx.value = 0;
			dy.value = 0;
			setDrag({ piece: i, members });
			send({ type: "lock", piece: i });
		})
		.onChange((e) => {
			if (target.current !== null) {
				// translation counts from the first touch, so the piece doesn't lag by the activation slop.
				dx.value = e.translationX / sc.value;
				dy.value = e.translationY / sc.value;
			} else {
				tx.value += e.changeX;
				ty.value += e.changeY;
			}
		})
		.onEnd(() => {
			const i = target.current;
			const p = i === null ? undefined : state.current?.pieces[i];
			if (i !== null && p) {
				// Keep the group where it was dropped until the server echoes the drop.
				send({ type: "drop", piece: i, x: p.x + dx.value, y: p.y + dy.value });
			}
			target.current = null;
		});

	const pinch = Gesture.Pinch()
		.runOnJS(true)
		.onChange((e) => {
			const s = Math.min(4, Math.max(0.05, sc.value * e.scaleChange));
			const k = s / sc.value;
			tx.value = e.focalX - (e.focalX - tx.value) * k;
			ty.value = e.focalY - (e.focalY - ty.value) * k;
			sc.value = s;
		});

	const s = state.current;
	// Lets device automation find pieces on screen during development.
	if (__DEV__) {
		Object.assign(globalThis, {
			__puzzle: {
				state: s,
				size: size.current,
				hitTest,
				paths,
				send,
				ws: () => ws.current?.readyState,
				cam: () => ({ tx: tx.value, ty: ty.value, sc: sc.value }),
			},
		});
	}

	return (
		<View className="flex-1 bg-[#1c1917]">
			<GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
				<View
					className="flex-1"
					onLayout={(e: LayoutChangeEvent) => {
						size.current = e.nativeEvent.layout;
						if (s) fit(s);
					}}
				>
					{s && image && (
						<Canvas style={{ flex: 1 }}>
							<Group transform={camera}>
								<Rect
									x={0}
									y={0}
									width={s.cols * s.w}
									height={s.rows * s.h}
									style="stroke"
									strokeWidth={2}
									color="rgba(255,255,255,0.15)"
								/>
								{order.current.map((i) =>
									drag?.members.has(i) ? null : (
										<Piece
											key={i}
											i={i}
											s={s}
											me={me.current}
											image={image}
											path={paths[i]}
										/>
									),
								)}
								<Group transform={dragOffset}>
									{drag &&
										[...drag.members].map((i) => (
											<Piece
												key={i}
												i={i}
												s={s}
												me={me.current}
												image={image}
												path={paths[i]}
											/>
										))}
								</Group>
							</Group>
						</Canvas>
					)}
				</View>
			</GestureDetector>

			<View
				pointerEvents="box-none"
				className="absolute inset-x-0 bottom-0 flex-row items-center gap-2 p-3"
				style={{ paddingBottom: insets.bottom + 12 }}
			>
				<Text className="rounded bg-black/60 px-2 py-1 font-mono text-white">
					{room.code}
				</Text>
				<Text className="rounded bg-black/60 px-2 py-1 text-white">
					{players.length} / 4
					{status !== "playing"
						? ` · ${status === "done" ? "Solved! 🎉" : status}`
						: ""}
				</Text>
				<Pressable
					accessibilityRole="button"
					className="ml-auto rounded bg-white px-3 py-1.5 active:opacity-70"
					onPress={() => send({ type: "tidy" })}
				>
					<Text className="font-medium text-black">Tidy pile</Text>
				</Pressable>
			</View>
		</View>
	);
}

function Piece({
	i,
	s,
	me,
	image,
	path,
}: {
	i: number;
	s: State;
	me: string;
	image: SkImage;
	path?: SkPath;
}) {
	const p = s.pieces[i];
	if (!p || !path || p.bag !== null) return null;
	const holder = s.locks[p.group];
	const theirs = holder !== undefined && holder !== me;
	const r = Math.floor(i / s.cols);
	const c = i % s.cols;
	return (
		<Group
			transform={[{ translateX: p.x }, { translateY: p.y }]}
			opacity={theirs ? 0.5 : 1}
		>
			<Group clip={path}>
				<Image
					image={image}
					x={-c * s.w}
					y={-r * s.h}
					width={s.cols * s.w}
					height={s.rows * s.h}
					fit="fill"
				/>
			</Group>
			<Path
				path={path}
				style="stroke"
				strokeWidth={1}
				color="rgba(0,0,0,0.4)"
			/>
		</Group>
	);
}
