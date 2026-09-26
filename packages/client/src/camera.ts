import type { State } from "@puzzle/game";

/** Maps table units to screen pixels: screen = (x, y) + scale * table. */
export type Camera = { x: number; y: number; scale: number };
export type Rect = { x: number; y: number; width: number; height: number };

const MIN_SCALE = 0.05;
const MAX_SCALE = 4;

/** The board plus every piece lying on the table (bagged pieces are hidden). */
export function tableBounds(state: State): Rect {
	let minX = 0;
	let minY = 0;
	let maxX = state.cols * state.w;
	let maxY = state.rows * state.h;
	for (const piece of state.pieces) {
		if (piece.bag !== null) continue;
		minX = Math.min(minX, piece.x);
		minY = Math.min(minY, piece.y);
		maxX = Math.max(maxX, piece.x + state.w);
		maxY = Math.max(maxY, piece.y + state.h);
	}
	return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Centres `bounds` in the viewport, filling `margin` of it. */
export function fitCamera(
	bounds: Rect,
	viewport: { width: number; height: number },
	margin = 0.9,
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

/** Zooms by `factor` keeping the screen point (focusX, focusY) fixed. */
export function zoomAt(
	camera: Camera,
	focusX: number,
	focusY: number,
	factor: number,
): Camera {
	const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, camera.scale * factor));
	const k = scale / camera.scale;
	return {
		scale,
		x: focusX - (focusX - camera.x) * k,
		y: focusY - (focusY - camera.y) * k,
	};
}
