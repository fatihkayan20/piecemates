import { z } from "zod";

import { seededRandom } from "./shape.ts";
import {
	clampToTable,
	freeSlot,
	onBoard,
	type Point,
	pileSlots,
} from "./table.ts";

// The room's Durable Object is the authority: it runs apply() and broadcasts
// every accepted message in order. Clients run the same apply(), so state stays
// identical everywhere without sending positions of anything but the dropped piece.

export const MAX_PLAYERS = 4;

export type Piece = {
	x: number;
	y: number;
	/** Id of the snapped group; pieces start alone (group === own index). */
	group: number;
	/** Bag id, or null when the piece is on the table. */
	bag: string | null;
	/** False while the piece sits in its view's pile (the table's or its bag's). */
	touched: boolean;
};

export type Bag = { name: string; color: string };

export type State = {
	rows: number;
	cols: number;
	/** Piece cell size in table units. The board is [0, cols*w] x [0, rows*h]. */
	w: number;
	h: number;
	pieces: Piece[];
	/** group id -> player id */
	locks: Record<number, string>;
	/** bag id -> bag */
	bags: Record<string, Bag>;
};

const pieceIndex = z.int().nonnegative();

export const ClientMsg = z.discriminatedUnion("type", [
	z.object({ type: z.literal("lock"), piece: pieceIndex }),
	z.object({ type: z.literal("unlock"), piece: pieceIndex }),
	z.object({
		type: z.literal("drop"),
		piece: pieceIndex,
		x: z.number(),
		y: z.number(),
	}),
	z.object({
		type: z.enum(["bag:create", "bag:update"]),
		bag: z.string().min(1).max(40),
		name: z.string().max(40),
		color: z.string().max(20),
	}),
	z.object({ type: z.literal("bag:delete"), bag: z.string() }),
	/** Moves the piece's whole group into a bag, or back to the table (null). */
	z.object({
		type: z.literal("bag:put"),
		piece: pieceIndex,
		bag: z.string().nullable(),
	}),
]);
export type ClientMsg = z.infer<typeof ClientMsg>;

/** `leave` is only produced by the server when a socket closes. */
export type Msg = ClientMsg | { type: "leave" };

export type Player = { id: string; name: string };

export type ServerMsg =
	| { type: "state"; state: State; you: string }
	| { type: "applied"; by: string; msg: Msg }
	| { type: "rejected"; msg: ClientMsg }
	| { type: "presence"; players: Player[] };

export function createState(opts: {
	seed: number;
	rows: number;
	cols: number;
	w: number;
	h: number;
}): State {
	const { seed, rows, cols, w, h } = opts;
	const random = seededRandom(seed ^ 0x9e3779b9);
	const pieces: Piece[] = Array.from({ length: rows * cols }, (_, i) => ({
		x: 0,
		y: 0,
		group: i,
		bag: null,
		touched: false,
	}));
	const state: State = { rows, cols, w, h, pieces, locks: {}, bags: {} };
	// Shuffle the pieces into the pile slots around the board.
	const order = pieces.map((_, i) => i);
	for (let i = order.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[order[i], order[j]] = [order[j] as number, order[i] as number];
	}
	const slots = pileSlots(state);
	order.forEach((index, k) => {
		Object.assign(pieces[index] as Piece, slots[k] as Point);
	});
	return state;
}

/** Row and column of a piece's correct cell. */
export function cellOf(state: State, index: number) {
	return { row: Math.floor(index / state.cols), col: index % state.cols };
}

/** Indices of every piece in the same group as `index` (including itself). */
export function groupOf(state: State, index: number): number[] {
	const group = state.pieces[index]?.group;
	return state.pieces.flatMap((p, i) => (p.group === group ? [i] : []));
}

/** True when another player holds the piece's group. */
export function lockedByOther(state: State, index: number, me: string) {
	const piece = state.pieces[index];
	const holder = piece && state.locks[piece.group];
	return holder !== undefined && holder !== me;
}

const piecesInGroup = (state: State, group: number) =>
	state.pieces.filter((p) => p.group === group);

/** Applies a message in place. Returns false (and changes nothing) if it's not allowed. */
export function apply(state: State, by: string, msg: Msg): boolean {
	switch (msg.type) {
		case "leave":
			release(state, by);
			return true;
		case "bag:create":
		case "bag:update":
			if (msg.bag in state.bags !== (msg.type === "bag:update")) return false;
			state.bags[msg.bag] = { name: msg.name, color: msg.color };
			return true;
		case "bag:delete": {
			if (!(msg.bag in state.bags)) return false;
			const groups = new Set(
				state.pieces.flatMap((p) => (p.bag === msg.bag ? [p.group] : [])),
			);
			for (const group of groups) moveToView(state, group, null);
			delete state.bags[msg.bag];
			return true;
		}
		case "bag:put": {
			const piece = state.pieces[msg.piece];
			if (
				!piece ||
				piece.bag === msg.bag ||
				(msg.bag !== null && !(msg.bag in state.bags)) ||
				lockedByOther(state, msg.piece, by)
			)
				return false;
			moveToView(state, piece.group, msg.bag);
			return true;
		}
		case "lock": {
			const piece = state.pieces[msg.piece];
			if (!piece || lockedByOther(state, msg.piece, by)) return false;
			release(state, by); // one piece per hand
			state.locks[piece.group] = by;
			return true;
		}
		case "unlock": {
			const piece = state.pieces[msg.piece];
			if (!piece || state.locks[piece.group] !== by) return false;
			delete state.locks[piece.group];
			return true;
		}
		case "drop": {
			const piece = state.pieces[msg.piece];
			if (!piece || state.locks[piece.group] !== by) return false;
			const members = groupOf(state, msg.piece);
			const { x: dx, y: dy } = clampToTable(
				state,
				members,
				msg.x - piece.x,
				msg.y - piece.y,
			);
			for (const member of piecesInGroup(state, piece.group)) {
				member.x += dx;
				member.y += dy;
				member.touched = true;
			}
			delete state.locks[piece.group];
			snap(state, piece.group);
			return true;
		}
	}
}

/**
 * Moves a group into a bag, or to the table (null). A lone piece goes into the
 * first free pile slot of its new view; a joined group keeps its place.
 */
function moveToView(state: State, group: number, view: string | null) {
	delete state.locks[group];
	const members = piecesInGroup(state, group);
	for (const p of members) p.bag = view;
	const [only] = members;
	if (members.length !== 1 || !only) return;
	only.touched = false;
	Object.assign(only, freeSlot(state, view, only));
}

/**
 * Pieces shown in a view. The table shows everything not in a bag. A bag shows
 * its own pieces plus the puzzle so far (joined groups and pieces on the
 * board), so they can be snapped on; loose table pieces stay hidden.
 */
export function visibleIn(state: State, view: string | null): Set<number> {
	const sizes = new Map<number, number>();
	for (const p of state.pieces)
		sizes.set(p.group, (sizes.get(p.group) ?? 0) + 1);
	const visible = new Set<number>();
	state.pieces.forEach((p, i) => {
		const puzzle =
			view !== null &&
			p.bag === null &&
			((sizes.get(p.group) ?? 0) > 1 || onBoard(state, p));
		if (p.bag === view || puzzle) visible.add(i);
	});
	return visible;
}

export function release(state: State, by: string) {
	for (const [group, holder] of Object.entries(state.locks)) {
		if (holder === by) delete state.locks[Number(group)];
	}
}

const NEIGHBOURS = [
	[-1, 0],
	[1, 0],
	[0, -1],
	[0, 1],
] as const;

/** Whether a piece's cell touches the board's frame. */
const onFrame = (state: State, index: number) => {
	const { row, col } = cellOf(state, index);
	return (
		row === 0 || col === 0 || row === state.rows - 1 || col === state.cols - 1
	);
};

/**
 * Sticks `group` to the board if one of its frame pieces lies near its spot
 * there. Returns whether the group moved.
 */
function stick(state: State, group: number, tolerance: number) {
	for (const [index, p] of state.pieces.entries()) {
		if (p.group !== group || !onFrame(state, index)) continue;
		const { row, col } = cellOf(state, index);
		const errX = col * state.w - p.x;
		const errY = row * state.h - p.y;
		// Already stuck (up to float drift from earlier moves).
		if (Math.abs(errX) < 1e-6 && Math.abs(errY) < 1e-6) return false;
		if (Math.abs(errX) > tolerance || Math.abs(errY) > tolerance) continue;
		for (const m of piecesInGroup(state, group)) {
			m.x += errX;
			m.y += errY;
		}
		return true;
	}
	return false;
}

/**
 * Merges `group` into any unlocked, correctly placed neighbour group in the
 * same view, and sticks it to the board frame, repeatedly. A bag group that
 * joins the puzzle or sticks to the frame leaves the bag.
 */
function snap(state: State, group: number) {
	const tolerance = 0.25 * Math.min(state.w, state.h);
	const view = state.pieces.find((p) => p.group === group)?.bag ?? null;
	const visible = visibleIn(state, view);
	let stuck = false;
	let merged = true;
	while (merged) {
		merged = stick(state, group, tolerance);
		stuck ||= merged;
		for (const [index, member] of state.pieces.entries()) {
			if (member.group !== group) continue;
			const { row, col } = cellOf(state, index);
			for (const [dRow, dCol] of NEIGHBOURS) {
				const nRow = row + dRow;
				const nCol = col + dCol;
				if (nRow < 0 || nRow >= state.rows || nCol < 0 || nCol >= state.cols)
					continue;
				const nIndex = nRow * state.cols + nCol;
				const neighbour = state.pieces[nIndex] as Piece;
				if (
					neighbour.group === group ||
					!visible.has(nIndex) ||
					state.locks[neighbour.group] !== undefined
				)
					continue;
				// How far the neighbour is from where it should sit relative to `member`.
				const errX = neighbour.x - (member.x + dCol * state.w);
				const errY = neighbour.y - (member.y + dRow * state.h);
				if (Math.abs(errX) > tolerance || Math.abs(errY) > tolerance) continue;
				const other = neighbour.group;
				for (const p of state.pieces) {
					if (p.group === group) {
						p.x += errX;
						p.y += errY;
					}
				}
				for (const p of state.pieces) {
					if (p.group !== other) continue;
					p.group = group;
					p.touched = true; // no longer part of the pile
				}
				merged = true;
				break;
			}
			if (merged) break;
		}
	}
	// Joined the puzzle: the whole group is on the table now.
	const members = piecesInGroup(state, group);
	if (stuck || members.some((p) => p.bag === null))
		for (const p of members) p.bag = null;
}

export function isComplete(state: State) {
	return state.pieces.every((p) => p.group === state.pieces[0]?.group);
}
