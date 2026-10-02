import {
	type Bag,
	type Clock,
	isPlaced,
	lockedByOther,
	type Player,
	type Rect,
	type State,
} from "@piecemates/game";

import type { Drag } from "./drag.ts";
import type { RoomConnection, RoomStatus } from "./room-connection.ts";
import { viewBounds } from "./view-bounds.ts";

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
	/** Quarter turns clockwise. */
	rot: number;
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
	/** Where my camera may go (see `viewBounds`). */
	bounds: Rect | null;
};

const sameView = (a: PieceView, b: PieceView) =>
	a.x === b.x &&
	a.y === b.y &&
	a.visible === b.visible &&
	a.held === b.held &&
	a.placed === b.placed &&
	a.rot === b.rot;

export function snapshot(conn: RoomConnection, prev: RoomSnapshot) {
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
			rot: state.pieces[i]?.rot ?? 0,
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
		bounds: viewBounds(conn, pieces),
	};
}
