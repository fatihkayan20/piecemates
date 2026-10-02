import { turn } from "./rotate.ts";
import { cellOf, homeError, isPlaced, piecesInGroup } from "./state.ts";
import type { Piece, State } from "./types.ts";
import { visibleIn } from "./views.ts";

/** How close to its spot a piece must be dropped to snap, as a share of the smaller cell side. */
const SNAP_TOLERANCE = 0.25;

/** Snap distance in table units. */
export const snapTolerance = (state: State) =>
	SNAP_TOLERANCE * Math.min(state.w, state.h);

export const NEIGHBOURS = [
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
		if (p.group !== group || p.rot !== 0 || !onFrame(state, index)) continue;
		if (isPlaced(state, index)) return false;
		const err = homeError(state, index);
		if (Math.abs(err.x) > tolerance || Math.abs(err.y) > tolerance) continue;
		for (const m of piecesInGroup(state, group)) {
			m.x += err.x;
			m.y += err.y;
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
export function snap(state: State, group: number) {
	const tolerance = snapTolerance(state);
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
				// An untouched neighbour sits where each device draws its own pile,
				// so the room can't tell where it was seen; the client places it first.
				if (
					!neighbour.touched ||
					neighbour.group === group ||
					neighbour.rot !== member.rot ||
					!visible.has(nIndex) ||
					state.locks[neighbour.group] !== undefined
				)
					continue;
				// How far the neighbour is from where it should sit relative to `member`,
				// with the offset turned the way both pieces are turned.
				const offset = turn(dCol * state.w, dRow * state.h, member.rot);
				const errX = neighbour.x - (member.x + offset.x);
				const errY = neighbour.y - (member.y + offset.y);
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
	// Joined the puzzle or sits in its spot: the whole group is on the table now.
	const members = piecesInGroup(state, group);
	const placed = state.pieces.some(
		(p, i) => p.group === group && isPlaced(state, i),
	);
	if (stuck || placed || members.some((p) => p.bag === null))
		for (const p of members) p.bag = null;
}
