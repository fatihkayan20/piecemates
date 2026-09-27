import {
	type Camera,
	type DropRect,
	dropTargetAt,
	finishDrag,
	measureDropTargets,
	roomStore,
	setHoveredTarget,
	startDrag,
	turnPiece,
} from "@piecemates/client";
import type {
	Application,
	Container,
	FederatedPointerEvent,
	Graphics,
} from "pixi.js";

import type { BoardCamera } from "./camera";
import { place } from "./scene";

/** A press that moves less than this many screen pixels is a tap (it turns the piece). */
const TAP_SLOP_PX = 4;

type Point = { x: number; y: number };

/** The midpoint of the first two fingers and how far apart they are. */
const span = (fingers: Map<number, Point>) => {
	const [a, b] = [...fingers.values()];
	if (!a || !b) return null;
	const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
	return { mid, dist: Math.hypot(a.x - b.x, a.y - b.y) };
};

/**
 * Pointer input on the table: grab a piece and drop it (on the table or a bag
 * chip), drag empty space to pan, or pinch it with two fingers to zoom.
 */
export function attachPointer(
	app: Application,
	world: Container,
	pieces: Graphics[],
	camera: BoardCamera,
) {
	/** Where the pointer grabbed, in table units, while I'm dragging. */
	let grab: { x: number; y: number } | null = null;
	/** Where the press began on screen, to tell a tap from a drag. */
	let pressed = { x: 0, y: 0 };
	let targets = new Map<string, DropRect>();
	let panGrab: { x: number; y: number } | null = null;
	/** Fingers down on empty table; Pixi's canvas turns off the browser's own pinch. */
	const fingers = new Map<number, Point>();
	let pinch: { camera: Camera; mid: Point; dist: number } | null = null;

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
			pressed = { x: e.global.x, y: e.global.y };
			targets = measureDropTargets();
		});
	});

	app.stage.eventMode = "static";
	app.stage.hitArea = app.screen;
	app.stage.on("pointerdown", (e) => {
		fingers.set(e.pointerId, { x: e.global.x, y: e.global.y });
		const start = span(fingers);
		pinch = start && { camera: camera.get(), ...start };
		panGrab = pinch
			? null
			: { x: e.global.x - world.x, y: e.global.y - world.y };
	});
	app.stage.on("globalpointermove", (e) => {
		if (fingers.has(e.pointerId))
			fingers.set(e.pointerId, { x: e.global.x, y: e.global.y });
		const now = pinch && span(fingers);
		if (pinch && now) {
			camera.pinch(pinch.camera, pinch.mid, now.mid, now.dist / pinch.dist);
			return;
		}
		const drag = roomStore.getState().drag;
		if (grab && drag) {
			setHoveredTarget(targetAt(e));
			const { x, y } = offset(e);
			for (const [m, start] of drag.starts)
				if (pieces[m]) place(pieces[m], start.x + x, start.y + y);
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
			const moved = Math.hypot(e.global.x - pressed.x, e.global.y - pressed.y);
			if (moved >= TAP_SLOP_PX || !turnPiece(conn, drag.piece))
				finishDrag(conn, drag, targetAt(e), x, y);
		}
		fingers.delete(e.pointerId);
		pinch = null;
		grab = null;
		panGrab = null;
		setHoveredTarget(null);
	};
	app.stage.on("pointerup", release);
	app.stage.on("pointerupoutside", release);
	app.stage.on("pointercancel", release);
	app.canvas.addEventListener("wheel", camera.wheel, { passive: false });
}
