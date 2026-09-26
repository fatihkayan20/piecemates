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
import { useEffect, useReducer, useRef } from "react";

import { openRoomSocket } from "@/lib/api";

type Drag = {
	piece: number;
	members: number[];
	/** Where the pointer grabbed the piece, relative to its top-left. */
	grabX: number;
	grabY: number;
};

async function loadTexture(url: string) {
	const img = new Image();
	img.crossOrigin = "anonymous";
	img.src = url;
	await img.decode();
	return Texture.from(img);
}

export function PuzzleBoard({ room }: { room: RoomInfo }) {
	const host = useRef<HTMLDivElement>(null);
	const connection = useRef<RoomConnection | null>(null);
	const [, rerender] = useReducer((n: number) => n + 1, 0);

	useEffect(() => {
		const el = host.current;
		if (!el) return;
		const app = new Application();
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
			const socket = await openRoomSocket(room.code);
			if (disposed) return socket.close();

			// The world container is the table; its position and scale are the camera.
			const world = new Container({ sortableChildren: true });
			app.stage.addChild(world);
			app.stage.eventMode = "static";
			app.stage.hitArea = app.screen;

			let pieceGraphics: Graphics[] = [];
			let topZ = 0;
			let drag: Drag | null = null;
			let panGrab: { x: number; y: number } | null = null;

			const conn = new RoomConnection(socket, (event) => {
				const state = conn.state;
				if (event.type === "state" && pieceGraphics.length === 0 && state) {
					drawPieces(state);
					setCamera(fitCamera(tableBounds(state), app.screen));
				} else if (
					event.type === "rejected" &&
					event.msg.type === "lock" &&
					event.msg.piece === drag?.piece
				) {
					drag = null;
				}
				syncPieces();
				rerender();
			});
			connection.current = conn;

			const camera = (): Camera => ({
				x: world.x,
				y: world.y,
				scale: world.scale.x,
			});
			const setCamera = (c: Camera) => {
				world.scale.set(c.scale);
				world.position.set(c.x, c.y);
			};

			const drawPieces = (state: State) => {
				const { rows, cols, w, h } = state;
				const edges = generateEdges(room.seed, rows, cols);
				const texturePxPerUnit = texture.width / (cols * w);
				world.addChild(
					new Graphics()
						.rect(0, 0, cols * w, rows * h)
						.stroke({ width: 2, color: 0xffffff, alpha: 0.15 }),
				);
				pieceGraphics = edges.map((pieceEdges, i) => {
					const { row, col } = cellOf(state, i);
					const g = new Graphics()
						.path(new GraphicsPath(piecePath(pieceEdges, w, h)))
						.fill({
							texture,
							textureSpace: "global",
							matrix: new Matrix()
								.scale(1 / texturePxPerUnit, 1 / texturePxPerUnit)
								.translate(-col * w, -row * h),
						})
						.stroke({ width: 1, color: 0x000000, alpha: 0.4 });
					g.eventMode = "static";
					g.cursor = "grab";
					g.on("pointerdown", (e) => startDrag(i, e));
					world.addChild(g);
					return g;
				});
			};

			/** Moves every piece to its state position, except the ones being dragged. */
			const syncPieces = () => {
				const state = conn.state;
				if (!state) return;
				for (const [i, piece] of state.pieces.entries()) {
					const g = pieceGraphics[i];
					if (!g || drag?.members.includes(i)) continue;
					g.position.set(piece.x, piece.y);
					g.visible = piece.bag === null;
					const theirs = lockedByOther(state, i, conn.me);
					g.alpha = theirs ? 0.5 : 1;
					g.eventMode = theirs ? "none" : "static";
				}
			};

			const startDrag = (i: number, e: FederatedPointerEvent) => {
				const piece = conn.state?.pieces[i];
				if (!conn.state || !piece) return;
				e.stopPropagation();
				const members = groupOf(conn.state, i);
				const at = world.toLocal(e.global);
				drag = {
					piece: i,
					members,
					grabX: at.x - piece.x,
					grabY: at.y - piece.y,
				};
				topZ++;
				for (const m of members)
					if (pieceGraphics[m]) pieceGraphics[m].zIndex = topZ;
				conn.send({ type: "lock", piece: i });
			};

			app.stage.on("pointerdown", (e) => {
				panGrab = { x: e.global.x - world.x, y: e.global.y - world.y };
			});
			app.stage.on("globalpointermove", (e) => {
				const state = conn.state;
				if (drag && state) {
					const at = world.toLocal(e.global);
					const origin = state.pieces[drag.piece] as State["pieces"][number];
					const dx = at.x - drag.grabX - origin.x;
					const dy = at.y - drag.grabY - origin.y;
					for (const m of drag.members) {
						const piece = state.pieces[m];
						if (piece)
							pieceGraphics[m]?.position.set(piece.x + dx, piece.y + dy);
					}
				} else if (panGrab) {
					world.position.set(e.global.x - panGrab.x, e.global.y - panGrab.y);
				}
			});
			const endPointer = () => {
				if (drag) {
					const g = pieceGraphics[drag.piece];
					// Positions update when the server echoes the drop back.
					if (g) conn.send({ type: "drop", piece: drag.piece, x: g.x, y: g.y });
					drag = null;
				}
				panGrab = null;
			};
			app.stage.on("pointerup", endPointer);
			app.stage.on("pointerupoutside", endPointer);

			app.canvas.addEventListener(
				"wheel",
				(e) => {
					e.preventDefault();
					setCamera(
						zoomAt(camera(), e.offsetX, e.offsetY, Math.exp(-e.deltaY * 0.001)),
					);
				},
				{ passive: false },
			);

			// Lets browser automation find pieces on screen during development.
			if (import.meta.env.DEV) {
				Object.assign(window, {
					__puzzle: {
						get state() {
							return conn.state;
						},
						world,
						at: (i: number) => {
							const g = pieceGraphics[i];
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
		})();

		return () => {
			disposed = true;
			connection.current?.close();
			connection.current = null;
			void ready.finally(() => app.destroy(true, { children: true }));
		};
	}, [room]);

	const conn = connection.current;
	const players = conn?.players ?? [];
	const status = conn?.status ?? "connecting";

	return (
		<div className="relative h-full min-h-0 overflow-hidden">
			<div ref={host} className="absolute inset-0" />
			<div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-3 p-3 text-sm">
				<span className="pointer-events-auto rounded bg-black/60 px-2 py-1 font-mono">
					Room {room.code}
				</span>
				<span className="rounded bg-black/60 px-2 py-1">
					{players.length} / {MAX_PLAYERS} ·{" "}
					{players.map((p) => p.name).join(", ")}
				</span>
				{status !== "playing" && (
					<span className="rounded bg-black/60 px-2 py-1">
						{status === "done" ? "Solved! 🎉" : status}
					</span>
				)}
				<Button
					className="pointer-events-auto ml-auto"
					size="sm"
					onClick={() => conn?.send({ type: "tidy" })}
				>
					Tidy pile
				</Button>
			</div>
		</div>
	);
}
