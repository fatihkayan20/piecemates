import { freeSlot } from "./pile.ts";
import { piecesInGroup } from "./state.ts";
import { onBoard } from "./table.ts";
import type { State } from "./types.ts";

/**
 * Moves a group into a bag, or to the table (null). A lone piece goes into the
 * first free pile slot of its new view; a joined group keeps its place.
 */
export function moveToView(state: State, group: number, view: string | null) {
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
