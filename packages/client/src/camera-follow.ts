import { type Rect, TAB_SIZE, tableRect } from "@piecemates/game";

import {
	type Camera,
	fitCamera,
	frameCamera,
	startCamera,
	type Viewport,
} from "./camera.ts";
import type { RoomConnection } from "./room-connection.ts";
import { roomStore } from "./room-store.ts";

/** How an app's board reads and moves its camera. */
export type CameraControl = {
	get(): Camera;
	set(camera: Camera): void;
	viewport(): Viewport;
};

/** Bounding box of a bag's pieces with their tabs, or null for an empty bag. */
function bagBounds(conn: RoomConnection, bag: string): Rect | null {
	const { state } = conn;
	if (!state) return null;
	const at = state.pieces.flatMap((p, i) =>
		p.bag === bag ? [conn.position(i)] : [],
	);
	if (at.length === 0) return null;
	const tabX = TAB_SIZE * state.w;
	const tabY = TAB_SIZE * state.h;
	const x = Math.min(...at.map((p) => p.x)) - tabX;
	const y = Math.min(...at.map((p) => p.y)) - tabY;
	const right = Math.max(...at.map((p) => p.x)) + state.w + tabX;
	const bottom = Math.max(...at.map((p) => p.y)) + state.h + tabY;
	return { x, y, width: right - x, height: bottom - y };
}

/**
 * Moves the camera with the room: the start view when a room loads, a bag's
 * pieces when it opens, back to where I was when I return to the table, and
 * the whole picture when the puzzle is solved. Returns the unsubscribe.
 */
export function followRoom(camera: CameraControl) {
	/** The table camera from before I opened a bag. */
	let tableCamera: Camera | null = null;
	return roomStore.subscribe((snap, prev) => {
		const state = snap.conn?.state;
		const viewport = camera.viewport();
		if (!state || !viewport.width) return;
		const board = {
			x: 0,
			y: 0,
			width: state.cols * state.w,
			height: state.rows * state.h,
		};
		if (snap.status === "done" && prev.status !== "done")
			return camera.set(fitCamera(board, viewport));
		if (!prev.grid)
			return camera.set(startCamera(tableRect(state), state, viewport));
		if (snap.view === prev.view) return;
		if (prev.view === null) tableCamera = camera.get();
		if (snap.view === null) {
			if (tableCamera) camera.set(tableCamera);
			return;
		}
		const bounds = snap.conn && bagBounds(snap.conn, snap.view);
		if (bounds) camera.set(frameCamera(bounds, state, viewport));
	});
}
