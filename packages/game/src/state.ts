import { seededRandom } from "./shape.ts";
import { type Point, pileSlots } from "./table.ts";
import type { Piece, State } from "./types.ts";

/** Keeps the pile shuffle apart from the edge shapes drawn from the same seed. */
const SHUFFLE_SALT = 0x9e3779b9;
/** Float drift allowed for a piece to still count as in its spot. */
export const PLACED_EPSILON = 1e-6;

export function createState(opts: {
	seed: number;
	rows: number;
	cols: number;
	w: number;
	h: number;
}): State {
	const { seed, rows, cols, w, h } = opts;
	const random = seededRandom(seed ^ SHUFFLE_SALT);
	const pieces: Piece[] = Array.from({ length: rows * cols }, (_, i) => ({
		x: 0,
		y: 0,
		group: i,
		bag: null,
		touched: false,
	}));
	const state: State = {
		rows,
		cols,
		w,
		h,
		pieces,
		locks: {},
		bags: {},
		clock: { played: 0, since: null },
	};
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
export function cellOf(state: Pick<State, "cols">, index: number) {
	return { row: Math.floor(index / state.cols), col: index % state.cols };
}

/** Indices of every piece in the same group as `index` (including itself). */
export function groupOf(state: State, index: number): number[] {
	const group = state.pieces[index]?.group;
	return state.pieces.flatMap((p, i) => (p.group === group ? [i] : []));
}

/** Error from a piece's correct spot on the board. */
export function homeError(state: State, index: number) {
	const piece = state.pieces[index] as Piece;
	const { row, col } = cellOf(state, index);
	return { x: col * state.w - piece.x, y: row * state.h - piece.y };
}

/** Whether the piece sits in its correct spot (up to float drift), so it can't move any more. */
export function isPlaced(state: State, index: number) {
	const err = homeError(state, index);
	return Math.abs(err.x) < PLACED_EPSILON && Math.abs(err.y) < PLACED_EPSILON;
}

/** True when another player holds the piece's group. */
export function lockedByOther(state: State, index: number, me: string) {
	const piece = state.pieces[index];
	const holder = piece && state.locks[piece.group];
	return holder !== undefined && holder !== me;
}

export const piecesInGroup = (state: State, group: number) =>
	state.pieces.filter((p) => p.group === group);

export function isComplete(state: State) {
	return state.pieces.every((p) => p.group === state.pieces[0]?.group);
}
