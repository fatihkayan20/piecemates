import { z } from "zod";

import { seededRandom } from "./shape.ts";

// The room's Durable Object is the authority: it runs apply() and broadcasts
// every accepted message in order. Clients run the same apply(), so state stays
// identical everywhere without sending positions of anything but the dropped piece.

export const MAX_PLAYERS = 4;

export type Piece = {
	x: number;
	y: number;
	/** Id of the snapped group; pieces start alone (group === own index). */
	group: number;
	bag: string | null;
	touched: boolean;
};

export type State = {
	rows: number;
	cols: number;
	/** Piece cell size in table units. The board is [0, cols*w] x [0, rows*h]. */
	w: number;
	h: number;
	pieces: Piece[];
	/** group id -> player id */
	locks: Record<number, string>;
	/** bag id -> name */
	bags: Record<string, string>;
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
		type: z.literal("bag:create"),
		bag: z.string().min(1).max(40),
		name: z.string().max(40),
	}),
	z.object({
		type: z.literal("bag:put"),
		bag: z.string(),
		pieces: z.array(pieceIndex).min(1).max(1000),
	}),
	z.object({ type: z.literal("tidy") }),
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
	// tidy() lays pieces out in their current order, so shuffle the order first.
	const order = pieces.map((_, i) => i);
	for (let i = order.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[order[i], order[j]] = [order[j] as number, order[i] as number];
	}
	order.forEach((index, slot) => {
		const piece = pieces[index] as Piece;
		piece.x = slot;
		piece.y = 0;
	});
	const state: State = { rows, cols, w, h, pieces, locks: {}, bags: {} };
	tidy(state);
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
		case "tidy":
			tidy(state);
			return true;
		case "bag:create":
			if (msg.bag in state.bags) return false;
			state.bags[msg.bag] = msg.name;
			return true;
		case "bag:put": {
			if (!(msg.bag in state.bags)) return false;
			const allowed = msg.pieces.every((index) => {
				const piece = state.pieces[index];
				return (
					piece &&
					!lockedByOther(state, index, by) &&
					piecesInGroup(state, piece.group).length === 1
				);
			});
			if (!allowed) return false;
			for (const index of msg.pieces) {
				const piece = state.pieces[index] as Piece;
				piece.bag = msg.bag;
				piece.touched = true;
				delete state.locks[piece.group];
			}
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
			const dx = msg.x - piece.x;
			const dy = msg.y - piece.y;
			for (const member of piecesInGroup(state, piece.group)) {
				member.x += dx;
				member.y += dy;
				member.bag = null;
				member.touched = true;
			}
			delete state.locks[piece.group];
			snap(state, piece.group);
			return true;
		}
	}
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

/** Merges `group` into any unlocked, correctly placed neighbour group, repeatedly. */
function snap(state: State, group: number) {
	const tolerance = 0.25 * Math.min(state.w, state.h);
	let merged = true;
	while (merged) {
		merged = false;
		for (const [index, member] of state.pieces.entries()) {
			if (member.group !== group) continue;
			const { row, col } = cellOf(state, index);
			for (const [dRow, dCol] of NEIGHBOURS) {
				const nRow = row + dRow;
				const nCol = col + dCol;
				if (nRow < 0 || nRow >= state.rows || nCol < 0 || nCol >= state.cols)
					continue;
				const neighbour = state.pieces[nRow * state.cols + nCol] as Piece;
				if (
					neighbour.group === group ||
					neighbour.bag !== null ||
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
				for (const p of state.pieces) if (p.group === other) p.group = group;
				merged = true;
				break;
			}
			if (merged) break;
		}
	}
}

/** Lays out untouched loose pieces in a grid below the board, keeping their current order. */
export function tidy(state: State) {
	const cellW = state.w * 1.6;
	const cellH = state.h * 1.6;
	const perRow = Math.max(1, Math.ceil((state.cols * state.w) / cellW));
	const top = state.rows * state.h + state.h;
	const loose = state.pieces
		.filter(
			(p) => !p.touched && p.bag === null && state.locks[p.group] === undefined,
		)
		.sort((a, b) => a.y - b.y || a.x - b.x);
	loose.forEach((piece, i) => {
		piece.x = (i % perRow) * cellW;
		piece.y = top + Math.floor(i / perRow) * cellH;
	});
}

export function isComplete(state: State) {
	return state.pieces.every((p) => p.group === state.pieces[0]?.group);
}
