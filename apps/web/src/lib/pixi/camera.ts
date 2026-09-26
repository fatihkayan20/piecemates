import {
	type Camera,
	clampCamera,
	fitCamera,
	roomStore,
	zoomAt,
} from "@puzzle/client";
import { tableRect } from "@puzzle/game";
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
	return {
		get,
		set,
		/** Shows the whole table. */
		fit: () => {
			const bounds = table();
			if (bounds) set(fitCamera(bounds, screen));
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
