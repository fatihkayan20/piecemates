import { turn } from "./rotate.ts";
import { NEIGHBOURS, snapTolerance } from "./snap.ts";
import { cellOf } from "./state.ts";
import type { Point } from "./table.ts";
import type { State } from "./types.ts";

/**
 * Untouched pieces my drop would snap to as I see them: correct neighbours of
 * the dropped group whose spot on my screen (`positionOf`) lies within snap
 * distance. The room only snaps to moved pieces, so the client drops these
 * where I see them first.
 */
export function pileNeighbours(
	state: State,
	members: number[],
	dropAt: (index: number) => Point,
	positionOf: (index: number) => Point,
	visible: (index: number) => boolean,
): number[] {
	const tolerance = snapTolerance(state);
	const found = new Set<number>();
	for (const m of members) {
		const member = state.pieces[m];
		if (!member) continue;
		const at = dropAt(m);
		const { row, col } = cellOf(state, m);
		for (const [dRow, dCol] of NEIGHBOURS) {
			const nRow = row + dRow;
			const nCol = col + dCol;
			if (nRow < 0 || nRow >= state.rows || nCol < 0 || nCol >= state.cols)
				continue;
			const n = nRow * state.cols + nCol;
			const neighbour = state.pieces[n];
			if (
				!neighbour ||
				neighbour.touched ||
				members.includes(n) ||
				neighbour.rot !== member.rot ||
				state.locks[neighbour.group] !== undefined ||
				!visible(n)
			)
				continue;
			const offset = turn(dCol * state.w, dRow * state.h, member.rot);
			const seen = positionOf(n);
			if (
				Math.abs(seen.x - (at.x + offset.x)) <= tolerance &&
				Math.abs(seen.y - (at.y + offset.y)) <= tolerance
			)
				found.add(n);
		}
	}
	return [...found];
}
