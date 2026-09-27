import type { State } from "./types.ts";

// The table is the board, free space around it to work in, and the pile of
// loose pieces in rings along the table's outer edge. It has a fixed size, so
// drops can be kept on it and every device can zoom out to see all of it.

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };

/** Pile slot size in piece cells; the extra room keeps tabs from overlapping. */
const SLOT = 1.6;
/** Free space between the board and the pile: this share of the board's longer side... */
const FREE_SHARE = 0.15;
/** ...but at least this many slots. */
const MIN_FREE_SLOTS = 2;

type Layout = { slots: Point[]; table: Rect };
const layouts = new Map<string, Layout>();

/** Pile slots, outermost ring first, each ring clockwise from the top-left. */
function layout(state: State): Layout {
	const { rows, cols, w, h } = state;
	const count = rows * cols;
	const key = `${rows}x${cols}x${w}x${h}`;
	const cached = layouts.get(key);
	if (cached) return cached;

	const slotW = w * SLOT;
	const slotH = h * SLOT;
	// Piece top-left inside its slot, so the piece sits in the middle.
	const padX = (slotW - w) / 2;
	const padY = (slotH - h) / 2;
	const free = Math.max(
		MIN_FREE_SLOTS * Math.max(slotW, slotH),
		FREE_SHARE * Math.max(cols * w, rows * h),
	);
	/** Outer edge of ring `ring` (1 = the ring next to the free space). */
	const ringRect = (ring: number): Rect => {
		const x = -free - ring * slotW;
		const y = -free - ring * slotH;
		return { x, y, width: cols * w - 2 * x, height: rows * h - 2 * y };
	};

	const rings: Point[][] = [];
	let capacity = 0;
	while (capacity < count) {
		const r = ringRect(rings.length + 1);
		const across = Math.floor(r.width / slotW);
		const down = Math.floor(r.height / slotH);
		const right = r.x + r.width - slotW;
		const bottom = r.y + r.height - slotH;
		const ring: Point[] = [];
		const at = (x: number, y: number) =>
			ring.push({ x: x + padX, y: y + padY });
		for (let i = 0; i < across; i++) at(r.x + i * slotW, r.y);
		for (let i = 1; i < down - 1; i++) at(right, r.y + i * slotH);
		for (let i = across - 1; i >= 0; i--) at(r.x + i * slotW, bottom);
		for (let i = down - 2; i >= 1; i--) at(r.x, r.y + i * slotH);
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
	const result = { slots, table: ringRect(rings.length) };
	layouts.set(key, result);
	return result;
}

export const pileSlots = (state: State) => layout(state).slots;

/** The whole playing area in table units. Drops are kept inside it. */
export const tableRect = (state: State) => layout(state).table;

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

/** Whether a piece's centre lies on the board, i.e. it has been placed in the puzzle. */
export const onBoard = (state: State, p: Point) => {
	const cx = p.x + state.w / 2;
	const cy = p.y + state.h / 2;
	return (
		cx > 0 && cx < state.cols * state.w && cy > 0 && cy < state.rows * state.h
	);
};

/**
 * New positions for a view's pile pieces: packed into the first free slots, keeping
 * their order around the rings (so tidying twice changes nothing). Pieces not
 * sitting in a slot, e.g. from an older layout, go after the others.
 */
export function tidyPositions(
	state: State,
	view: string | null,
	positionOf: (index: number) => Point,
): Map<number, Point> {
	const slots = pileSlots(state);
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

/** Shift (dx, dy) so the moved group stays on the table. */
export function clampToTable(
	state: State,
	members: number[],
	dx: number,
	dy: number,
): Point {
	const t = tableRect(state);
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
