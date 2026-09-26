import {
	type Camera,
	fitCamera,
	RoomConnection,
	type RoomInfo,
	tableBounds,
	zoomAt,
} from "@puzzle/client";
import {
	cellOf,
	generateEdges,
	groupOf,
	lockedByOther,
	MAX_PLAYERS,
	piecePath,
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

import { openRoomSocket } from "@/lib/api";

type Drag = { piece: number; members: Set<number> };

export function PuzzleBoard({ room }: { room: RoomInfo }) {
	const image = useImage(room.imageUrl);
	const insets = useSafeAreaInsets();
	const [, rerender] = useReducer((n: number) => n + 1, 0);
	const [drag, setDrag] = useState<Drag | null>(null);

	const connection = useRef<RoomConnection | null>(null);
	const drawOrder = useRef<number[]>([]); // last = on top
	const viewport = useRef({ width: 0, height: 0 });
	const touchedPiece = useRef<number | null>(null);
	const dragRef = useRef<Drag | null>(null);
	dragRef.current = drag;
	// Kept in a ref (not useMemo) so Fast Refresh can't leave it empty.
	const paths = useRef<SkPath[]>([]).current;

	// Camera: screen = camera + scale * table. The dragged group gets an extra offset in table units.
	const cameraX = useSharedValue(0);
	const cameraY = useSharedValue(0);
	const cameraScale = useSharedValue(1);
	const dragX = useSharedValue(0);
	const dragY = useSharedValue(0);
	const cameraTransform = useDerivedValue(() => [
		{ translateX: cameraX.value },
		{ translateY: cameraY.value },
		{ scale: cameraScale.value },
	]);
	const dragTransform = useDerivedValue(() => [
		{ translateX: dragX.value },
		{ translateY: dragY.value },
	]);

	const camera = (): Camera => ({
		x: cameraX.value,
		y: cameraY.value,
		scale: cameraScale.value,
	});
	const setCamera = (c: Camera) => {
		cameraX.value = c.x;
		cameraY.value = c.y;
		cameraScale.value = c.scale;
	};
	const fitToView = (state: State) => {
		if (viewport.current.width)
			setCamera(fitCamera(tableBounds(state), viewport.current));
	};

	const endDrag = () => {
		setDrag(null);
		dragX.value = 0;
		dragY.value = 0;
	};

	const buildPaths = (state: State) => {
		const edges = generateEdges(room.seed, state.rows, state.cols);
		for (const pieceEdges of edges) {
			paths.push(
				Skia.Path.MakeFromSVGString(
					piecePath(pieceEdges, state.w, state.h),
				) as SkPath,
			);
		}
		drawOrder.current = edges.map((_, i) => i);
	};

	useEffect(() => {
		let closed = false;
		void openRoomSocket(room.code).then((socket) => {
			if (closed) return socket.close();
			const conn = new RoomConnection(socket, (event) => {
				const state = conn.state;
				if (event.type === "state" && state) {
					const first = paths.length === 0;
					if (first) buildPaths(state);
					if (first) fitToView(state);
				} else if (event.type === "applied") {
					const dragging = dragRef.current;
					if (
						event.by === conn.me &&
						event.msg.type === "drop" &&
						dragging?.piece === event.msg.piece
					)
						endDrag();
				} else if (event.type === "rejected") {
					if (event.msg.type === "lock" || event.msg.type === "drop") endDrag();
				}
				rerender();
			});
			connection.current = conn;
		});
		return () => {
			closed = true;
			connection.current?.close();
			connection.current = null;
		};
	}, [room]);

	const conn = connection.current;
	const state = conn?.state ?? null;
	const send: RoomConnection["send"] = (msg) => connection.current?.send(msg);

	/** Topmost piece I may pick up at a screen point. */
	const pieceAt = (x: number, y: number) => {
		const conn = connection.current;
		const state = conn?.state;
		if (!state || !conn) return null;
		const tableX = (x - cameraX.value) / cameraScale.value;
		const tableY = (y - cameraY.value) / cameraScale.value;
		for (let k = drawOrder.current.length - 1; k >= 0; k--) {
			const i = drawOrder.current[k] as number;
			const piece = state.pieces[i];
			if (!piece || piece.bag !== null || lockedByOther(state, i, conn.me))
				continue;
			if (paths[i]?.contains(tableX - piece.x, tableY - piece.y)) return i;
		}
		return null;
	};

	// ponytail: gestures run on the JS thread; move to worklets if drag stutters at 1000 pieces.
	const pan = Gesture.Pan()
		.runOnJS(true)
		.maxPointers(1)
		.onBegin((e) => {
			touchedPiece.current = dragRef.current ? null : pieceAt(e.x, e.y);
		})
		.onStart(() => {
			const i = touchedPiece.current;
			const state = connection.current?.state;
			if (!state || i === null) return;
			const members = new Set(groupOf(state, i));
			drawOrder.current = [
				...drawOrder.current.filter((j) => !members.has(j)),
				...members,
			];
			dragX.value = 0;
			dragY.value = 0;
			setDrag({ piece: i, members });
			send({ type: "lock", piece: i });
		})
		.onChange((e) => {
			if (touchedPiece.current !== null) {
				// Translation counts from the first touch, so the piece doesn't lag by the activation slop.
				dragX.value = e.translationX / cameraScale.value;
				dragY.value = e.translationY / cameraScale.value;
			} else {
				cameraX.value += e.changeX;
				cameraY.value += e.changeY;
			}
		})
		.onEnd((e) => {
			const i = touchedPiece.current;
			const piece =
				i === null ? undefined : connection.current?.state?.pieces[i];
			if (i !== null && piece) {
				// Use the final translation; the last move may not have reached onChange.
				dragX.value = e.translationX / cameraScale.value;
				dragY.value = e.translationY / cameraScale.value;
				// The group stays where it was dropped until the server echoes the drop.
				send({
					type: "drop",
					piece: i,
					x: piece.x + dragX.value,
					y: piece.y + dragY.value,
				});
			}
			touchedPiece.current = null;
		});

	const pinch = Gesture.Pinch()
		.runOnJS(true)
		.onChange((e) =>
			setCamera(zoomAt(camera(), e.focalX, e.focalY, e.scaleChange)),
		);

	// Lets device automation find pieces on screen during development.
	if (__DEV__) {
		Object.assign(globalThis, {
			__puzzle: {
				state,
				viewport: viewport.current,
				pieceAt,
				paths,
				send,
				camera,
			},
		});
	}

	const players = conn?.players ?? [];
	const status = conn?.status ?? "connecting";
	const me = conn?.me ?? "";

	return (
		<View className="flex-1 bg-[#1c1917]">
			<GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
				<View
					className="flex-1"
					onLayout={(e: LayoutChangeEvent) => {
						viewport.current = e.nativeEvent.layout;
						if (state) fitToView(state);
					}}
				>
					{state && image && (
						<Canvas style={{ flex: 1 }}>
							<Group transform={cameraTransform}>
								<Rect
									x={0}
									y={0}
									width={state.cols * state.w}
									height={state.rows * state.h}
									style="stroke"
									strokeWidth={2}
									color="rgba(255,255,255,0.15)"
								/>
								{drawOrder.current.map((i) =>
									drag?.members.has(i) ? null : (
										<Piece
											key={i}
											index={i}
											state={state}
											me={me}
											image={image}
											path={paths[i]}
										/>
									),
								)}
								<Group transform={dragTransform}>
									{drag &&
										[...drag.members].map((i) => (
											<Piece
												key={i}
												index={i}
												state={state}
												me={me}
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
					{players.length} / {MAX_PLAYERS}
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
	index,
	state,
	me,
	image,
	path,
}: {
	index: number;
	state: State;
	me: string;
	image: SkImage;
	path?: SkPath;
}) {
	const piece = state.pieces[index];
	if (!piece || !path || piece.bag !== null) return null;
	const { row, col } = cellOf(state, index);
	return (
		<Group
			transform={[{ translateX: piece.x }, { translateY: piece.y }]}
			opacity={lockedByOther(state, index, me) ? 0.5 : 1}
		>
			<Group clip={path}>
				<Image
					image={image}
					x={-col * state.w}
					y={-row * state.h}
					width={state.cols * state.w}
					height={state.rows * state.h}
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
