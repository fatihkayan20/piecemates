import { type Rect, TAB_SIZE } from "@piecemates/game";

import type { RoomConnection } from "./room-connection.ts";

/**
 * Where my camera may go: my table, grown to take in every piece I can see,
 * since another player's screen has its own pile and may drop pieces outside
 * mine.
 */
export function viewBounds(
	conn: RoomConnection,
	pieces: { x: number; y: number; visible: boolean }[],
): Rect | null {
	const state = conn.state;
	if (!state) return null;
	const table = conn.pile.table(state);
	const tabX = TAB_SIZE * state.w;
	const tabY = TAB_SIZE * state.h;
	let x = table.x;
	let y = table.y;
	let right = table.x + table.width;
	let bottom = table.y + table.height;
	for (const p of pieces) {
		if (!p.visible) continue;
		x = Math.min(x, p.x - tabX);
		y = Math.min(y, p.y - tabY);
		right = Math.max(right, p.x + state.w + tabX);
		bottom = Math.max(bottom, p.y + state.h + tabY);
	}
	return { x, y, width: right - x, height: bottom - y };
}
