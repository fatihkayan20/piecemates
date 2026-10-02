import { isPlaced } from "@piecemates/game";
import { track } from "@piecemates/telemetry";
import { createStore } from "zustand/vanilla";

import { beginDrag, endsDrag } from "./drag.ts";
import { reconnector } from "./reconnect.ts";
import { RoomConnection } from "./room-connection.ts";
import { type RoomSnapshot, snapshot } from "./room-snapshot.ts";

const empty: RoomSnapshot = {
	conn: null,
	grid: null,
	pieces: [],
	order: [],
	drag: null,
	players: [],
	status: "connecting",
	view: null,
	bags: [],
	hovered: null,
	clock: null,
	bounds: null,
};

// One room is open at a time, so the store is a singleton; apps wrap it in a hook.
export const roomStore = createStore<RoomSnapshot>(() => empty);

const PERCENT = 100;

/**
 * Opens the room on a socket. With `reopen`, a dropped socket is replaced and
 * the room picks up where it was; my drag ends, since the room freed my pieces.
 */
export function connectRoom(
	socket: WebSocket,
	reopen?: () => Promise<WebSocket>,
) {
	const reconnect = reopen && reconnector(reopen);
	const conn = new RoomConnection(socket, (event) => {
		// A refused bag:put leaves the piece locked by me.
		if (event.type === "rejected" && event.msg.type === "bag:put")
			conn.send({ type: "unlock", piece: event.msg.piece });
		roomStore.setState((s) => {
			const settled =
				event.type === "closed" ||
				(s.drag && endsDrag(event, conn.me, s.drag.piece));
			return { ...snapshot(conn, s), drag: settled ? null : s.drag };
		});
		reconnect?.(event, conn);
	});
	roomStore.setState({ ...empty, conn });
	if (boardAspect) conn.setAspect(boardAspect);
	return conn;
}

/** My board's width / height, kept for the next room I open. */
let boardAspect: number | undefined;

/** Lays my untouched pieces out for my board's size, now and in rooms I open later. */
export function setBoardSize({
	width,
	height,
}: {
	width: number;
	height: number;
}) {
	if (!width || !height) return;
	boardAspect = width / height;
	roomStore.getState().conn?.setAspect(boardAspect);
}

/** Closes the open room, if it's still `conn`, and resets the store. */
export function disconnectRoom(conn: RoomConnection) {
	const { state } = conn;
	if (state && conn.status !== "done") {
		const placed = state.pieces.filter((_, i) => isPlaced(state, i)).length;
		track("room_left", {
			pieces: state.pieces.length,
			placed_percent: Math.round((placed / state.pieces.length) * PERCENT),
		});
	}
	conn.close();
	if (roomStore.getState().conn === conn) roomStore.setState(empty);
}

/** Picks up a piece's group and brings it to the top. The drag ends when the server settles it. */
export function startDrag(piece: number) {
	const { conn, order } = roomStore.getState();
	const drag = conn && beginDrag(conn, piece);
	if (!drag) return null;
	const top = order.filter((i) => !drag.starts.has(i));
	roomStore.setState({ drag, order: [...top, ...drag.starts.keys()] });
	return drag;
}

/** Forgets my drag without waiting for the server (the board already drew the drop). */
export const clearDrag = () => roomStore.setState({ drag: null });

export const setHoveredTarget = (hovered: string | null) => {
	if (roomStore.getState().hovered !== hovered) roomStore.setState({ hovered });
};
