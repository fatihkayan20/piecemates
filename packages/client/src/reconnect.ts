import { CLOSE_POLICY } from "@piecemates/game";

import type { RoomConnection, RoomEvent } from "./room-connection.ts";

/** First wait before reopening a dropped room socket; it doubles each try... */
const RECONNECT_MS = 1000;
/** ...up to this. */
const MAX_RECONNECT_MS = 8000;
/** Tries in a row before giving up; each one spends the player's API budget. */
const MAX_RECONNECTS = 8;

/**
 * Reopens the room socket after it drops (a phone put the page in the
 * background, the network blinked), unless the room closed it for good.
 * Returns the handler for the connection's events.
 */
export function reconnector(reopen: () => Promise<WebSocket>) {
	let tries = 0;
	const retry = (conn: RoomConnection) => {
		if (tries >= MAX_RECONNECTS) return;
		const wait = Math.min(MAX_RECONNECT_MS, RECONNECT_MS * 2 ** tries++);
		setTimeout(() => {
			reopen().then(
				(socket) => conn.attach(socket),
				() => retry(conn),
			);
		}, wait);
	};
	return (event: RoomEvent, conn: RoomConnection) => {
		if (event.type === "state") tries = 0;
		if (event.type === "closed" && event.code !== CLOSE_POLICY) retry(conn);
	};
}
