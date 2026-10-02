import { MAX_TABLE_ASPECT, type State } from "./types.ts";

// The table is the board, free space around it to work in, and the pile of
// loose pieces in rings along the table's outer edge. The room lays the pile
// out once, but each device draws untouched pieces in a layout shaped to its
// own screen: the same slot rank, in that device's slots.

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };

/**
 * How tightly the pile packs. `slot`: slot size in piece cells (tabs reach
 * 0.26 past each edge, so below 1.52 neighbouring tabs may interleave, as on a
 * real table). `freeShare`: free space between the board and the pile, as a
 * share of the board's longer side, but at least `minFree` slots.
 */
const PACKED = { slot: 1.25, freeShare: 0.05, minFree: 1 };
/** Rooms made before `aspect` keep this roomier layout, so their pieces stay in their slots. */
const FIRST = { slot: 1.6, freeShare: 0.15, minFree: 2 };

type Layout = { slots: Point[]; table: Rect };
const layouts = new Map<string, Layout>();

/**
 * Pile slots, outermost ring first, each ring clockwise from the top-left.
 * Each ring adds a slot row above and below the last, a slot column on each
 * side, or both: towards the room's `aspect` so the table suits the screen it
 * was made on, or both ways for rooms without one.
 */
function layout(state: State, aspect: number | undefined): Layout {
	const { rows, cols, w, h } = state;
	const count = rows * cols;
	const key = `${rows}x${cols}x${w}x${h}x${aspect}`;
	const cached = layouts.get(key);
	if (cached) return cached;

	const { slot, freeShare, minFree } = aspect === undefined ? FIRST : PACKED;
	const slotW = w * slot;
	const slotH = h * slot;
	// Piece top-left inside its slot, so the piece sits in the middle.
	const padX = (slotW - w) / 2;
	const padY = (slotH - h) / 2;
	const free = Math.max(
		minFree * Math.max(slotW, slotH),
		freeShare * Math.max(cols * w, rows * h),
	);
	/** Outer edge of the last ring (the free space before the first). */
	let r: Rect = {
		x: -free,
		y: -free,
		width: cols * w + 2 * free,
		height: rows * h + 2 * free,
	};

	const rings: Point[][] = [];
	let capacity = 0;
	while (capacity < count) {
		const wider = aspect === undefined || r.width / r.height < aspect;
		const taller = aspect === undefined || r.width / r.height >= aspect;
		const dx = wider ? slotW : 0;
		const dy = taller ? slotH : 0;
		r = {
			x: r.x - dx,
			y: r.y - dy,
			width: r.width + 2 * dx,
			height: r.height + 2 * dy,
		};
		const across = Math.floor(r.width / slotW);
		const down = Math.floor(r.height / slotH);
		const right = r.x + r.width - slotW;
		const bottom = r.y + r.height - slotH;
		// The rows take the corners when the ring has both.
		const first = taller ? 1 : 0;
		const last = taller ? down - 1 : down;
		const ring: Point[] = [];
		const at = (x: number, y: number) =>
			ring.push({ x: x + padX, y: y + padY });
		if (taller) for (let i = 0; i < across; i++) at(r.x + i * slotW, r.y);
		if (wider) for (let i = first; i < last; i++) at(right, r.y + i * slotH);
		if (taller)
			for (let i = across - 1; i >= 0; i--) at(r.x + i * slotW, bottom);
		if (wider) for (let i = last - 1; i >= first; i--) at(r.x, r.y + i * slotH);
		rings.push(ring);
		capacity += ring.length;
	}

	// Fill from the outside in; spread the leftover over the innermost ring
	// instead of bunching it in one corner.
	const slots: Point[] = [];
	for (const ring of rings.reverse()) {
		const need = Math.min(ring.length, count - slots.length);
		for (let k = 0; k < need; k++) {
			slots.push(ring[Math.floor((k * ring.length) / need)] as Point);
		}
	}
	const result = { slots, table: r };
	layouts.set(key, result);
	return result;
}

/** Pile slots for a screen shape; the room's own shape by default. */
export const pileSlots = (state: State, aspect = state.aspect) =>
	layout(state, aspect).slots;

/** The table for a screen shape in table units; the room's own shape by default. */
export const tableRect = (state: State, aspect = state.aspect) =>
	layout(state, aspect).table;

const ranks = new WeakMap<Point[], Map<string, number>>();
/** A point's rank among the room's pile slots, or undefined off them. */
export function slotRank(state: State, p: Point) {
	const slots = pileSlots(state);
	let rank = ranks.get(slots);
	if (!rank) {
		rank = new Map(slots.map((s, i) => [`${s.x},${s.y}`, i]));
		ranks.set(slots, rank);
	}
	return rank.get(`${p.x},${p.y}`);
}

/**
 * Where drops may land: the room's table and every screen shape's table, so a
 * piece dropped in any device's pile area stays there.
 */
export function playArea(state: State): Rect {
	const all = [
		tableRect(state),
		tableRect(state, MAX_TABLE_ASPECT),
		tableRect(state, 1 / MAX_TABLE_ASPECT),
	];
	const x = Math.min(...all.map((t) => t.x));
	const y = Math.min(...all.map((t) => t.y));
	const right = Math.max(...all.map((t) => t.x + t.width));
	const bottom = Math.max(...all.map((t) => t.y + t.height));
	return { x, y, width: right - x, height: bottom - y };
}

/** Whether a piece's centre lies on the board, i.e. it has been placed in the puzzle. */
export const onBoard = (state: State, p: Point) => {
	const cx = p.x + state.w / 2;
	const cy = p.y + state.h / 2;
	return (
		cx > 0 && cx < state.cols * state.w && cy > 0 && cy < state.rows * state.h
	);
};

/** Shift (dx, dy) so the moved group stays in the play area. */
export function clampToTable(
	state: State,
	members: number[],
	dx: number,
	dy: number,
): Point {
	const t = playArea(state);
	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;
	for (const i of members) {
		const p = state.pieces[i];
		if (!p) continue;
		// A piece turned sideways swaps its width and height around its centre.
		const halfW = (p.rot % 2 ? state.h : state.w) / 2;
		const halfH = (p.rot % 2 ? state.w : state.h) / 2;
		const cx = p.x + dx + state.w / 2;
		const cy = p.y + dy + state.h / 2;
		minX = Math.min(minX, cx - halfW);
		minY = Math.min(minY, cy - halfH);
		maxX = Math.max(maxX, cx + halfW);
		maxY = Math.max(maxY, cy + halfH);
	}
	const shiftX = Math.max(0, t.x - minX) - Math.max(0, maxX - (t.x + t.width));
	const shiftY = Math.max(0, t.y - minY) - Math.max(0, maxY - (t.y + t.height));
	return { x: dx + shiftX, y: dy + shiftY };
}
