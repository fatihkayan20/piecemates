import type { State } from "./types.ts";

// The table is the board, free space around it to work in, and the pile of
// loose pieces in rings along the table's outer edge. It has a fixed size, so
// drops can be kept on it and every device can zoom out to see all of it.

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
function layout(state: State): Layout {
	const { rows, cols, w, h, aspect } = state;
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
