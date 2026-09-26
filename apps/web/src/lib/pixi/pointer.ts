import {
	type DropRect,
	dropTargetAt,
	finishDrag,
	measureDropTargets,
	roomStore,
	setHoveredTarget,
	startDrag,
} from "@piecemates/client";
import type {
	Application,
	Container,
	FederatedPointerEvent,
	Graphics,
} from "pixi.js";

import type { BoardCamera } from "./camera";

/**
 * Pointer input on the table: grab a piece and drop it (on the table or a bag
 * chip), or drag empty space to pan.
 */
export function attachPointer(
	app: Application,
	world: Container,
	pieces: Graphics[],
	camera: BoardCamera,
) {
	/** Where the pointer grabbed, in table units, while I'm dragging. */
	let grab: { x: number; y: number } | null = null;
	let targets = new Map<string, DropRect>();
	let panGrab: { x: number; y: number } | null = null;

	const offset = (e: FederatedPointerEvent) => {
		const at = world.toLocal(e.global);
		return grab ? { x: at.x - grab.x, y: at.y - grab.y } : { x: 0, y: 0 };
	};
	/** The bag bar target under the pointer; it can leave the canvas mid-drag. */
	const targetAt = (e: FederatedPointerEvent) =>
		dropTargetAt(targets, e.clientX, e.clientY);

	pieces.forEach((g, i) => {
		g.on("pointerdown", (e) => {
			e.stopPropagation();
			if (!startDrag(i)) return;
			grab = world.toLocal(e.global);
			targets = measureDropTargets();
		});
	});

	app.stage.eventMode = "static";
	app.stage.hitArea = app.screen;
	app.stage.on("pointerdown", (e) => {
		panGrab = { x: e.global.x - world.x, y: e.global.y - world.y };
	});
	app.stage.on("globalpointermove", (e) => {
		const drag = roomStore.getState().drag;
		if (grab && drag) {
			setHoveredTarget(targetAt(e));
			const { x, y } = offset(e);
			for (const [m, start] of drag.starts)
				pieces[m]?.position.set(start.x + x, start.y + y);
		} else if (panGrab) {
			const c = camera.get();
			camera.set({
				...c,
				x: e.global.x - panGrab.x,
				y: e.global.y - panGrab.y,
			});
		}
	});
	const release = (e: FederatedPointerEvent) => {
		const { conn, drag } = roomStore.getState();
		// The group stays where it was dropped until the server echoes it.
		if (grab && conn && drag) {
			const { x, y } = offset(e);
			finishDrag(conn, drag, targetAt(e), x, y);
		}
		grab = null;
		panGrab = null;
		setHoveredTarget(null);
	};
	app.stage.on("pointerup", release);
	app.stage.on("pointerupoutside", release);
	app.canvas.addEventListener("wheel", camera.wheel, { passive: false });
}
