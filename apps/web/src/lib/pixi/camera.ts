import {
	type Camera,
	clampCamera,
	debounce,
	pinchCamera,
	RESIZE_DEBOUNCE_MS,
	resizeCamera,
	roomStore,
	setBoardSize,
	zoomAt,
} from "@piecemates/client";
import type { Container, Rectangle } from "pixi.js";

type Point = { x: number; y: number };

/** How fast the wheel zooms, per pixel of scroll. */
const WHEEL_ZOOM = 0.001;

/** The camera is the world container's position and scale: screen = camera + scale * table. */
export function createCamera(world: Container, screen: Rectangle) {
	/** My table and every piece on it (see `viewBounds`). */
	const table = () => roomStore.getState().bounds;
	const get = (): Camera => ({ x: world.x, y: world.y, scale: world.scale.x });
	/** Every camera change goes through here, so the table stays on screen. */
	const set = (next: Camera) => {
		const bounds = table();
		const c = bounds ? clampCamera(next, bounds, screen) : next;
		world.scale.set(c.scale);
		world.position.set(c.x, c.y);
	};
	// app.screen changes in place, so the size before a resize is kept here.
	let last = { width: screen.width, height: screen.height };
	return {
		get,
		set,
		viewport: () => screen,
		/** Keeps the zoom and centre point when the canvas changes size, and lays my pile out for it. */
		resize: debounce(() => {
			const to = { width: screen.width, height: screen.height };
			setBoardSize(to);
			const bounds = table();
			if (bounds) set(resizeCamera(get(), bounds, last, to));
			last = to;
		}, RESIZE_DEBOUNCE_MS),
		/** Zooms and moves with two fingers, from where they were when the pinch began. */
		pinch: (start: Camera, from: Point, to: Point, scale: number) => {
			const bounds = table();
			if (bounds) set(pinchCamera(start, from, to, scale, bounds, screen));
		},
		wheel: (e: WheelEvent) => {
			e.preventDefault();
			const bounds = table();
			const factor = Math.exp(-e.deltaY * WHEEL_ZOOM);
			if (bounds)
				set(zoomAt(get(), e.offsetX, e.offsetY, factor, bounds, screen));
		},
	};
}

export type BoardCamera = ReturnType<typeof createCamera>;
