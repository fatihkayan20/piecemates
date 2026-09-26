import {
	type Camera,
	clampCamera,
	debounce,
	fitCamera,
	RESIZE_DEBOUNCE_MS,
	resizeCamera,
	roomStore,
	zoomAt,
} from "@piecemates/client";
import { tableRect } from "@piecemates/game";
import type { Container, Rectangle } from "pixi.js";

/** How fast the wheel zooms, per pixel of scroll. */
const WHEEL_ZOOM = 0.001;

/** The camera is the world container's position and scale: screen = camera + scale * table. */
export function createCamera(world: Container, screen: Rectangle) {
	const table = () => {
		const state = roomStore.getState().conn?.state;
		return state ? tableRect(state) : null;
	};
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
		/** Shows the whole table. */
		fit: () => {
			const bounds = table();
			if (bounds) set(fitCamera(bounds, screen));
		},
		/** Keeps the zoom and centre point when the canvas changes size. */
		resize: debounce(() => {
			const bounds = table();
			const to = { width: screen.width, height: screen.height };
			if (bounds) set(resizeCamera(get(), bounds, last, to));
			last = to;
		}, RESIZE_DEBOUNCE_MS),
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
