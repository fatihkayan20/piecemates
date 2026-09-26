import type { Rect } from "@piecemates/game";

/** Maps table units to screen pixels: screen = (x, y) + scale * table. */
export type Camera = { x: number; y: number; scale: number };
export type Viewport = { width: number; height: number };

const MAX_SCALE = 4;
/** Smallest a piece may start on screen, in pixels, so a finger can pick it up. */
const START_PIECE_PX = 40;
/** Largest a piece gets when the camera frames a few pieces. */
const FRAME_PIECE_PX = 120;
/** How long the viewport must stay still before the camera follows a resize. */
export const RESIZE_DEBOUNCE_MS = 150;

/** Centres `bounds` in the viewport, filling `margin` of it. */
export function fitCamera(
	bounds: Rect,
	viewport: Viewport,
	margin = 0.95,
): Camera {
	const scale =
		Math.min(viewport.width / bounds.width, viewport.height / bounds.height) *
		margin;
	return centreOn(bounds, scale, viewport);
}

const centreOn = (bounds: Rect, scale: number, viewport: Viewport) => ({
	scale,
	x: (viewport.width - bounds.width * scale) / 2 - bounds.x * scale,
	y: (viewport.height - bounds.height * scale) / 2 - bounds.y * scale,
});

/** Piece size in table units, for the pixel limits below. */
type PieceSize = { w: number; h: number };

/**
 * The first view of a room: the whole table, unless its pieces would be too
 * small to pick up; then zoomed in on the top of the pile.
 */
export function startCamera(
	table: Rect,
	piece: PieceSize,
	viewport: Viewport,
): Camera {
	const fit = fitCamera(table, viewport);
	const scale = START_PIECE_PX / Math.min(piece.w, piece.h);
	if (fit.scale >= scale) return fit;
	// Centred on the top edge; clamping then pulls the edge up to the screen's.
	const top = centreOn({ ...table, height: 0 }, scale, viewport);
	return clampCamera(top, table, viewport);
}

/** Centres `bounds` in the viewport without making a piece bigger than FRAME_PIECE_PX. */
export function frameCamera(
	bounds: Rect,
	piece: PieceSize,
	viewport: Viewport,
): Camera {
	const fit = fitCamera(bounds, viewport);
	const max = FRAME_PIECE_PX / Math.max(piece.w, piece.h);
	return fit.scale <= max ? fit : centreOn(bounds, max, viewport);
}

/**
 * A two-finger pinch from its start: zooms by `scale` around where the fingers
 * began, then moves with them, so the table stays under the fingers.
 */
export function pinchCamera(
	start: Camera,
	from: { x: number; y: number },
	to: { x: number; y: number },
	scale: number,
	table: Rect,
	viewport: Viewport,
): Camera {
	const zoomed = zoomAt(start, from.x, from.y, scale, table, viewport);
	return {
		...zoomed,
		x: zoomed.x + to.x - from.x,
		y: zoomed.y + to.y - from.y,
	};
}

/**
 * Zooms by `factor` keeping the screen point (focusX, focusY) fixed. Never
 * zooms out further than showing the whole `table`.
 */
export function zoomAt(
	camera: Camera,
	focusX: number,
	focusY: number,
	factor: number,
	table: Rect,
	viewport: Viewport,
): Camera {
	const minScale = fitCamera(table, viewport).scale;
	const scale = Math.min(MAX_SCALE, Math.max(minScale, camera.scale * factor));
	const k = scale / camera.scale;
	return {
		scale,
		x: focusX - (focusX - camera.x) * k,
		y: focusY - (focusY - camera.y) * k,
	};
}

/**
 * Keeps the table on screen: centred on an axis where it fits, otherwise
 * panning stops at its edges.
 */
export function clampCamera(
	camera: Camera,
	table: Rect,
	viewport: Viewport,
): Camera {
	const axis = (pos: number, start: number, size: number, view: number) => {
		const px = size * camera.scale;
		if (px <= view) return (view - px) / 2 - start * camera.scale;
		const max = -start * camera.scale;
		return Math.min(max, Math.max(view - px + max, pos));
	};
	return {
		scale: camera.scale,
		x: axis(camera.x, table.x, table.width, viewport.width),
		y: axis(camera.y, table.y, table.height, viewport.height),
	};
}

/**
 * Follows a viewport resize: keeps the table point at the screen centre and
 * the zoom relative to the whole-table fit, then keeps the table on screen.
 */
export function resizeCamera(
	camera: Camera,
	table: Rect,
	from: Viewport,
	to: Viewport,
): Camera {
	const scale =
		(camera.scale * fitCamera(table, to).scale) / fitCamera(table, from).scale;
	const centreX = (from.width / 2 - camera.x) / camera.scale;
	const centreY = (from.height / 2 - camera.y) / camera.scale;
	return clampCamera(
		{
			scale,
			x: to.width / 2 - centreX * scale,
			y: to.height / 2 - centreY * scale,
		},
		table,
		to,
	);
}
