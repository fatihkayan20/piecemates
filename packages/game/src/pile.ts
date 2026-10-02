import { type Point, pileSlots } from "./table.ts";
import type { State } from "./types.ts";

/** Pieces a tidy may move in a view (null = the table): untouched, in that view, not held. */
export const inPile = (state: State, index: number, view: string | null) => {
	const piece = state.pieces[index];
	return (
		!!piece &&
		!piece.touched &&
		piece.bag === view &&
		state.locks[piece.group] === undefined
	);
};

/**
 * First pile slot in a view that no piece of that view covers, loose or moved
 * (a moved piece left on a slot still blocks it).
 */
export function freeSlot(
	state: State,
	view: string | null,
	except: Point,
): Point {
	const slots = pileSlots(state);
	const others = state.pieces.filter((p) => p !== except && p.bag === view);
	// ponytail: slots x pieces scan, fine for 1000 pieces on one put.
	const covered = (s: Point) =>
		others.some(
			(p) => Math.abs(p.x - s.x) < state.w && Math.abs(p.y - s.y) < state.h,
		);
	return slots.find((s) => !covered(s)) ?? (slots[0] as Point);
}

/**
 * New positions for a view's pile pieces: packed into the first free slots, keeping
 * their order around the rings (so tidying twice changes nothing). Pieces not
 * sitting in a slot, e.g. from an older layout, go after the others.
 */
export function tidyPositions(
	state: State,
	view: string | null,
	positionOf: (index: number) => Point,
	slots = pileSlots(state),
): Map<number, Point> {
	const slotRank = new Map(slots.map((s, rank) => [`${s.x},${s.y}`, rank]));
	const rankOf = (i: number) => {
		const p = positionOf(i);
		return slotRank.get(`${p.x},${p.y}`) ?? slots.length;
	};
	const pile = state.pieces
		.map((_, i) => i)
		.filter((i) => inPile(state, i, view))
		.sort((a, b) => {
			const pa = positionOf(a);
			const pb = positionOf(b);
			return rankOf(a) - rankOf(b) || pa.y - pb.y || pa.x - pb.x;
		});
	return new Map(pile.map((i, k) => [i, slots[k] as Point]));
}
