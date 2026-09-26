import type { Rect } from "@piecemates/game";

/** Maps table units to screen pixels: screen = (x, y) + scale * table. */
export type Camera = { x: number; y: number; scale: number };
type Viewport = { width: number; height: number };

const MAX_SCALE = 4;
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
	return {
		scale,
		x: (viewport.width - bounds.width * scale) / 2 - bounds.x * scale,
		y: (viewport.height - bounds.height * scale) / 2 - bounds.y * scale,
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
