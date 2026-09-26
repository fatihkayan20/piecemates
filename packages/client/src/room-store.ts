import {
	type Bag,
	type Clock,
	isPlaced,
	lockedByOther,
	type Player,
	type State,
} from "@piecemates/game";
import { createStore } from "zustand/vanilla";

import { beginDrag, type Drag, endsDrag } from "./drag.ts";
import {
	RoomConnection,
	type RoomEvent,
	type RoomStatus,
} from "./room-connection.ts";

export type BagChip = Bag & { id: string; count: number };
/** Board size; the object only changes when the room gets a new puzzle. */
export type Grid = Pick<State, "rows" | "cols" | "w" | "h">;
/** How to draw one piece on this device right now. */
export type PieceView = {
	x: number;
	y: number;
	visible: boolean;
	/** Held by another player. */
	held: boolean;
	placed: boolean;
};

/**
 * What the UI reads about the room I'm in. It's a snapshot rebuilt on every
 * room event, so React never sees the connection's in-place mutation.
 */
export type RoomSnapshot = {
	conn: RoomConnection | null;
	grid: Grid | null;
	pieces: PieceView[];
	/** Piece indices bottom to top; the last grabbed group is on top. */
	order: number[];
	drag: Drag | null;
	players: Player[];
	status: RoomStatus;
	/** The bag I'm looking at, or null for the table. */
	view: string | null;
	bags: BagChip[];
	/** The drop target under my drag, to highlight it. */
	hovered: string | null;
	/** Play time; the object is replaced whenever the server changes it. */
	clock: Clock | null;
};

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
};

// One room is open at a time, so the store is a singleton; apps wrap it in a hook.
export const roomStore = createStore<RoomSnapshot>(() => empty);

const sameView = (a: PieceView, b: PieceView) =>
	a.x === b.x &&
	a.y === b.y &&
	a.visible === b.visible &&
	a.held === b.held &&
	a.placed === b.placed;

function snapshot(conn: RoomConnection, prev: RoomSnapshot) {
	const state = conn.state;
	if (!state) return { players: conn.players, status: conn.status };
	const { rows, cols, w, h } = state;
	const g = prev.grid;
	const same = g?.rows === rows && g.cols === cols && g.w === w && g.h === h;
	const grid = same ? g : { rows, cols, w, h };
	// Unchanged pieces keep their object, so only moved pieces re-render.
	const pieces = state.pieces.map((_, i) => {
		const old = prev.pieces[i];
		const next = {
			...conn.position(i),
			visible: conn.visible(i),
			held: lockedByOther(state, i, conn.me),
			placed: isPlaced(state, i),
		};
		return old && sameView(old, next) ? old : next;
	});
	const bags = Object.entries(state.bags).map(([id, bag]) => ({
		...bag,
		id,
		count: state.pieces.filter((p) => p.bag === id).length,
	}));
	const order =
		prev.order.length === pieces.length ? prev.order : pieces.map((_, i) => i);
	return {
		grid,
		pieces,
		order,
		bags,
		players: conn.players,
		status: conn.status,
		view: conn.view,
		clock: state.clock,
	};
}

/** Opens the room on a socket; `onEvent` runs after the store has caught up. */
export function connectRoom(
	socket: WebSocket,
	onEvent?: (event: RoomEvent, conn: RoomConnection) => void,
) {
	const conn = new RoomConnection(socket, (event) => {
		// A refused bag:put leaves the piece locked by me.
		if (event.type === "rejected" && event.msg.type === "bag:put")
			conn.send({ type: "unlock", piece: event.msg.piece });
		roomStore.setState((s) => {
			const settled = s.drag && endsDrag(event, conn.me, s.drag.piece);
			return { ...snapshot(conn, s), drag: settled ? null : s.drag };
		});
		onEvent?.(event, conn);
	});
	roomStore.setState({ ...empty, conn });
	return conn;
}

/** Closes the open room, if it's still `conn`, and resets the store. */
export function disconnectRoom(conn: RoomConnection) {
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
