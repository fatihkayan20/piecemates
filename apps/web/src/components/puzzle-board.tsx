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
import { Button } from "@puzzle/ui/components/button";
import {
	Application,
	Container,
	type FederatedPointerEvent,
	Graphics,
	GraphicsPath,
	Matrix,
	Texture,
} from "pixi.js";
import { useEffect, useRef, useState } from "react";

import { type RoomInfo, roomSocketUrl } from "@/lib/api";

type Status = "connecting" | "playing" | "done" | "disconnected";

async function loadTexture(url: string) {
	const img = new Image();
	img.crossOrigin = "anonymous";
	img.src = url;
	await img.decode();
	return Texture.from(img);
}

export function PuzzleBoard({ room }: { room: RoomInfo }) {
	const host = useRef<HTMLDivElement>(null);
	const send = useRef<(msg: ClientMsg) => void>(() => {});
	const [players, setPlayers] = useState<Player[]>([]);
	const [status, setStatus] = useState<Status>("connecting");

	useEffect(() => {
		const el = host.current;
		if (!el) return;
		const app = new Application();
		let ws: WebSocket | undefined;
		let disposed = false;

		const ready = (async () => {
			await app.init({
				resizeTo: el,
				background: "#1c1917",
				antialias: true,
				autoDensity: true,
				resolution: devicePixelRatio,
			});
			if (disposed) return;
			el.appendChild(app.canvas);
			const texture = await loadTexture(room.imageUrl);
			if (disposed) return;

			const world = new Container({ sortableChildren: true });
			app.stage.addChild(world);
			app.stage.eventMode = "static";
			app.stage.hitArea = app.screen;

			let state: State | undefined;
			let me = "";
			let gfx: Graphics[] = [];
			let top = 0;
			let drag: {
				piece: number;
				members: number[];
				offX: number;
				offY: number;
			} | null = null;
			let pan: { x: number; y: number } | null = null;

			const build = (s: State) => {
				const { rows, cols, w, h } = s;
				const edges = generate(room.seed, rows, cols);
				const k = texture.width / (cols * w); // texture px per table unit
				world.addChild(
					new Graphics()
						.rect(0, 0, cols * w, rows * h)
						.stroke({ width: 2, color: 0xffffff, alpha: 0.15 }),
				);
				gfx = edges.map((e, i) => {
					const r = Math.floor(i / cols);
					const c = i % cols;
					const g = new Graphics()
						.path(new GraphicsPath(piecePath(e, w, h)))
						.fill({
							texture,
							textureSpace: "global",
							matrix: new Matrix()
								.scale(1 / k, 1 / k)
								.translate(-c * w, -r * h),
						})
						.stroke({ width: 1, color: 0x000000, alpha: 0.4 });
					g.eventMode = "static";
					g.cursor = "grab";
					g.on("pointerdown", (ev) => startDrag(i, ev));
					world.addChild(g);
					return g;
				});
			};

			// Fit everything (board + pile) on screen.
			const fit = () => {
				const b = world.getLocalBounds();
				const scale =
					Math.min(app.screen.width / b.width, app.screen.height / b.height) *
					0.9;
				world.scale.set(scale);
				world.position.set(
					(app.screen.width - b.width * scale) / 2 - b.x * scale,
					(app.screen.height - b.height * scale) / 2 - b.y * scale,
				);
			};

			const sync = () => {
				if (!state) return;
				for (const [i, p] of state.pieces.entries()) {
					const g = gfx[i];
					if (!g || drag?.members.includes(i)) continue;
					g.position.set(p.x, p.y);
					g.visible = p.bag === null;
					const holder = state.locks[p.group];
					const theirs = holder !== undefined && holder !== me;
					g.alpha = theirs ? 0.5 : 1;
					g.eventMode = theirs ? "none" : "static";
				}
			};

			const startDrag = (i: number, e: FederatedPointerEvent) => {
				const p = state?.pieces[i];
				if (!state || !p) return;
				e.stopPropagation();
				const members = state.pieces.flatMap((q, j) =>
					q.group === p.group ? [j] : [],
				);
				const at = world.toLocal(e.global);
				drag = { piece: i, members, offX: at.x - p.x, offY: at.y - p.y };
				top++;
				for (const m of members) if (gfx[m]) gfx[m].zIndex = top;
				send.current({ type: "lock", piece: i });
			};

			app.stage.on("pointerdown", (e) => {
				pan = { x: e.global.x - world.x, y: e.global.y - world.y };
			});
			app.stage.on("globalpointermove", (e) => {
				if (drag && state) {
					const at = world.toLocal(e.global);
					const origin = state.pieces[drag.piece] as State["pieces"][number];
					const dx = at.x - drag.offX - origin.x;
					const dy = at.y - drag.offY - origin.y;
					for (const m of drag.members) {
						const p = state.pieces[m];
						if (p) gfx[m]?.position.set(p.x + dx, p.y + dy);
					}
				} else if (pan) {
					world.position.set(e.global.x - pan.x, e.global.y - pan.y);
				}
			});
			const end = () => {
				if (drag) {
					const g = gfx[drag.piece];
					// Positions update when the server echoes the drop back.
					if (g)
						send.current({ type: "drop", piece: drag.piece, x: g.x, y: g.y });
					drag = null;
				}
				pan = null;
			};
			app.stage.on("pointerup", end);
			app.stage.on("pointerupoutside", end);

			app.canvas.addEventListener(
				"wheel",
				(e) => {
					e.preventDefault();
					const pt = { x: e.offsetX, y: e.offsetY };
					const before = world.toLocal(pt);
					world.scale.set(
						Math.min(
							4,
							Math.max(0.05, world.scale.x * Math.exp(-e.deltaY * 0.001)),
						),
					);
					const after = world.toGlobal(before);
					world.position.set(
						world.x + pt.x - after.x,
						world.y + pt.y - after.y,
					);
				},
				{ passive: false },
			);

			// ponytail: no auto-reconnect; the page shows "disconnected" and a reload rejoins.
			ws = new WebSocket(roomSocketUrl(room.code));
			send.current = (msg) => {
				if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
			};
			ws.onclose = () => !disposed && setStatus("disconnected");
			ws.onmessage = (ev) => {
				const msg = JSON.parse(ev.data) as ServerMsg;
				if (msg.type === "state") {
					const first = !state;
					state = msg.state;
					me = msg.you;
					if (first) build(state);
					sync();
					if (first) fit();
					// Lets browser automation find pieces on screen during development.
					if (import.meta.env.DEV) {
						Object.assign(window, {
							__puzzle: {
								state,
								world,
								at: (i: number) => {
									const g = gfx[i];
									if (!g) return null;
									const b = g.getBounds();
									return {
										x: (b.x + b.width / 2) / app.screen.width,
										y: (b.y + b.height / 2) / app.screen.height,
									};
								},
							},
						});
					}
					setStatus(isComplete(state) ? "done" : "playing");
				} else if (msg.type === "applied" && state) {
					apply(state, msg.by, msg.msg);
					if (msg.msg.type === "drop" && isComplete(state)) setStatus("done");
				} else if (msg.type === "rejected") {
					if (drag && msg.msg.type === "lock" && msg.msg.piece === drag.piece)
						drag = null;
				} else if (msg.type === "presence") {
					setPlayers(msg.players);
				}
				sync();
			};
		})();

		return () => {
			disposed = true;
			ws?.close();
			void ready.finally(() => app.destroy(true, { children: true }));
		};
	}, [room]);

	return (
		<div className="relative h-full min-h-0 overflow-hidden">
			<div ref={host} className="absolute inset-0" />
			<div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-3 p-3 text-sm">
				<span className="pointer-events-auto rounded bg-black/60 px-2 py-1 font-mono">
					Room {room.code}
				</span>
				<span className="rounded bg-black/60 px-2 py-1">
					{players.length} / 4 · {players.map((p) => p.name).join(", ")}
				</span>
				{status !== "playing" && (
					<span className="rounded bg-black/60 px-2 py-1">
						{status === "done" ? "Solved! 🎉" : status}
					</span>
				)}
				<Button
					className="pointer-events-auto ml-auto"
					size="sm"
					onClick={() => send.current({ type: "tidy" })}
				>
					Tidy pile
				</Button>
			</div>
		</div>
	);
}
