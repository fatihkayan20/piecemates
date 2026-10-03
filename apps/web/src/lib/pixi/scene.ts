import { BOARD_STYLE, type Grid, type RoomSnapshot } from "@piecemates/client";
import { cellOf, generateEdges, piecePath } from "@piecemates/game";
import {
	type Container,
	Graphics,
	GraphicsContext,
	GraphicsPath,
	Matrix,
	Texture,
} from "pixi.js";

export async function loadTexture(url: string) {
	const img = new Image();
	img.crossOrigin = "anonymous";
	img.src = url;
	await img.decode();
	return Texture.from(img);
}

/** Pixi's stroke alignment that keeps a stroke inside its shape. */
const STROKE_INSIDE = 1;

/** Each piece drawn flat (placed on the board) and raised (loose, with a shadow). */
const looks = new WeakMap<
	Graphics,
	{ flat: GraphicsContext; raised: GraphicsContext }
>();

/** Draws the board frame and every piece into `world`; returns the pieces by index. */
export function drawPieces(
	world: Container,
	texture: Texture,
	seed: number,
	grid: Grid,
) {
	const { rows, cols, w, h } = grid;
	const texturePxPerUnit = texture.width / (cols * w);
	world.addChild(
		new Graphics().rect(0, 0, cols * w, rows * h).stroke({
			width: BOARD_STYLE.frame.width,
			color: BOARD_STYLE.frame.color,
		}),
	);
	return generateEdges(seed, rows, cols).map((edges, i) => {
		const { row, col } = cellOf(grid, i);
		const path = new GraphicsPath(piecePath(edges, w, h));
		const draw = (shadow: boolean) => {
			const c = new GraphicsContext();
			if (shadow)
				c.translate(BOARD_STYLE.shadow.offset, BOARD_STYLE.shadow.offset)
					.path(path)
					.fill(BOARD_STYLE.shadow.color)
					.resetTransform();
			return c
				.path(path)
				.fill({
					texture,
					textureSpace: "global",
					matrix: new Matrix()
						.scale(1 / texturePxPerUnit, 1 / texturePxPerUnit)
						.translate(-col * w, -row * h),
				})
				.stroke({ ...BOARD_STYLE.bevel, alignment: STROKE_INSIDE })
				.stroke(BOARD_STYLE.outline);
		};
		const flat = draw(false);
		const g = new Graphics(draw(true));
		looks.set(g, { flat, raised: g.context });
		// Only the piece itself picks up the pointer, not its shadow.
		g.hitArea = { contains: (x, y) => flat.containsPoint({ x, y }) };
		g.cursor = "grab";
		// Turns go around the piece's centre; `place` puts its top-left.
		g.pivot.set(w / 2, h / 2);
		world.addChild(g);
		return g;
	});
}

/** Moves every piece to where the store says, except my dragged group (the pointer moves it). */
export function syncPieces(pieces: Graphics[], room: RoomSnapshot) {
	room.order.forEach((i, z) => {
		const g = pieces[i];
		const view = room.pieces[i];
		if (!g || !view) return;
		g.zIndex = z;
		g.visible = view.visible;
		g.alpha = view.held ? BOARD_STYLE.heldOpacity : 1;
		// Placed pieces let the pointer through, to the pieces under them or the camera.
		g.eventMode = view.held || view.placed ? "none" : "static";
		g.rotation = (view.rot * Math.PI) / 2;
		const look = looks.get(g);
		const context = view.placed ? look?.flat : look?.raised;
		if (context && g.context !== context) g.context = context;
		if (!room.drag?.starts.has(i)) place(g, view.x, view.y);
	});
}

/** Moves a piece so its cell's top-left is at (x, y) in table units. */
export const place = (g: Graphics, x: number, y: number) =>
	g.position.set(x + g.pivot.x, y + g.pivot.y);
