import { piecesInGroup } from "./state.ts";
import type { Point } from "./table.ts";
import type { State } from "./types.ts";

/** Quarter turns in a full turn. */
export const QUARTERS = 4;

/** A table vector turned `rot` quarter turns clockwise (y points down). */
export function turn(x: number, y: number, rot: number): Point {
	let v = { x, y };
	const quarters = ((rot % QUARTERS) + QUARTERS) % QUARTERS;
	for (let i = 0; i < quarters; i++) v = { x: -v.y, y: v.x };
	return v;
}

/** Turns a piece's group a quarter turn clockwise around the piece's centre. */
export function rotateGroup(state: State, index: number) {
	const pivot = state.pieces[index];
	if (!pivot) return;
	const { w, h } = state;
	const cx = pivot.x + w / 2;
	const cy = pivot.y + h / 2;
	for (const p of piecesInGroup(state, pivot.group)) {
		const c = turn(p.x + w / 2 - cx, p.y + h / 2 - cy, 1);
		p.x = cx + c.x - w / 2;
		p.y = cy + c.y - h / 2;
		p.rot = (p.rot + 1) % QUARTERS;
	}
}
