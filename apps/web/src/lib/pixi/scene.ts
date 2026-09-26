import { BOARD_STYLE, type Grid, type RoomSnapshot } from "@puzzle/client";
import { cellOf, generateEdges, piecePath } from "@puzzle/game";
import {
	type Container,
	Graphics,
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
		new Graphics()
			.rect(0, 0, cols * w, rows * h)
			.stroke({
				width: BOARD_STYLE.frame.width,
				color: BOARD_STYLE.frame.color,
			}),
	);
	return generateEdges(seed, rows, cols).map((edges, i) => {
		const { row, col } = cellOf(grid, i);
		const g = new Graphics()
			.path(new GraphicsPath(piecePath(edges, w, h)))
			.fill({
				texture,
				textureSpace: "global",
				matrix: new Matrix()
					.scale(1 / texturePxPerUnit, 1 / texturePxPerUnit)
					.translate(-col * w, -row * h),
			})
			.stroke({
				width: BOARD_STYLE.outline.width,
				color: BOARD_STYLE.outline.color,
			});
		g.cursor = "grab";
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
		if (!room.drag?.starts.has(i)) g.position.set(view.x, view.y);
	});
}
