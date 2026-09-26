import { z } from "zod";

import { rng } from "./shape.ts";

// The room's Durable Object is the authority: it runs apply() and broadcasts
// every accepted message in order. Clients run the same apply(), so state stays
// identical everywhere without sending positions of anything but the dropped piece.

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

const pieceId = z.int().nonnegative();

export const ClientMsg = z.discriminatedUnion("type", [
	z.object({ type: z.literal("lock"), piece: pieceId }),
	z.object({ type: z.literal("unlock"), piece: pieceId }),
	z.object({
		type: z.literal("drop"),
		piece: pieceId,
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
		pieces: z.array(pieceId).min(1).max(1000),
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
	const rand = rng(seed ^ 0x9e3779b9);
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
		const j = Math.floor(rand() * (i + 1));
		[order[i], order[j]] = [order[j] as number, order[i] as number];
	}
	order.forEach((id, slot) => {
		const p = pieces[id] as Piece;
		p.x = slot;
		p.y = 0;
	});
	const state: State = { rows, cols, w, h, pieces, locks: {}, bags: {} };
	tidy(state);
	return state;
}

const members = (s: State, group: number) =>
	s.pieces.filter((p) => p.group === group);

/** Applies a message in place. Returns false (and changes nothing) if it's not allowed. */
export function apply(s: State, by: string, msg: Msg): boolean {
	switch (msg.type) {
		case "leave":
			release(s, by);
			return true;
		case "tidy":
			tidy(s);
			return true;
		case "bag:create":
			if (msg.bag in s.bags) return false;
			s.bags[msg.bag] = msg.name;
			return true;
		case "bag:put": {
			if (!(msg.bag in s.bags)) return false;
			const ok = msg.pieces.every((id) => {
				const p = s.pieces[id];
				const lock = p && s.locks[p.group];
				return (
					p &&
					(lock === undefined || lock === by) &&
					members(s, p.group).length === 1
				);
			});
			if (!ok) return false;
			for (const id of msg.pieces) {
				const p = s.pieces[id] as Piece;
				p.bag = msg.bag;
				p.touched = true;
				delete s.locks[p.group];
			}
			return true;
		}
		case "lock": {
			const p = s.pieces[msg.piece];
			if (!p) return false;
			const holder = s.locks[p.group];
			if (holder !== undefined && holder !== by) return false;
			release(s, by); // one piece per hand
			s.locks[p.group] = by;
			return true;
		}
		case "unlock": {
			const p = s.pieces[msg.piece];
			if (!p || s.locks[p.group] !== by) return false;
			delete s.locks[p.group];
			return true;
		}
		case "drop": {
			const p = s.pieces[msg.piece];
			if (!p || s.locks[p.group] !== by) return false;
			const dx = msg.x - p.x;
			const dy = msg.y - p.y;
			for (const m of members(s, p.group)) {
				m.x += dx;
				m.y += dy;
				m.bag = null;
				m.touched = true;
			}
			delete s.locks[p.group];
			snap(s, p.group);
			return true;
		}
	}
}

export function release(s: State, by: string) {
	for (const [group, holder] of Object.entries(s.locks)) {
		if (holder === by) delete s.locks[Number(group)];
	}
}

/** Merges `group` into any unlocked, correctly placed neighbour group, repeatedly. */
function snap(s: State, group: number) {
	const tol = 0.25 * Math.min(s.w, s.h);
	let snapped = true;
	while (snapped) {
		snapped = false;
		for (const [i, m] of s.pieces.entries()) {
			if (m.group !== group) continue;
			const r = Math.floor(i / s.cols);
			const c = i % s.cols;
			for (const [dr, dc] of [
				[-1, 0],
				[1, 0],
				[0, -1],
				[0, 1],
			] as const) {
				const nr = r + dr;
				const nc = c + dc;
				if (nr < 0 || nr >= s.rows || nc < 0 || nc >= s.cols) continue;
				const n = s.pieces[nr * s.cols + nc] as Piece;
				if (
					n.group === group ||
					n.bag !== null ||
					s.locks[n.group] !== undefined
				)
					continue;
				const ex = n.x - (m.x + dc * s.w);
				const ey = n.y - (m.y + dr * s.h);
				if (Math.abs(ex) > tol || Math.abs(ey) > tol) continue;
				const other = n.group;
				for (const p of s.pieces) {
					if (p.group === group) {
						p.x += ex;
						p.y += ey;
					}
				}
				for (const p of s.pieces) if (p.group === other) p.group = group;
				snapped = true;
				break;
			}
			if (snapped) break;
		}
	}
}

/** Lays out untouched loose pieces in a grid below the board, keeping their current order. */
export function tidy(s: State) {
	const cellW = s.w * 1.6;
	const cellH = s.h * 1.6;
	const perRow = Math.max(1, Math.ceil((s.cols * s.w) / cellW));
	const top = s.rows * s.h + s.h;
	const loose = s.pieces
		.filter(
			(p) => !p.touched && p.bag === null && s.locks[p.group] === undefined,
		)
		.sort((a, b) => a.y - b.y || a.x - b.x);
	loose.forEach((p, i) => {
		p.x = (i % perRow) * cellW;
		p.y = top + Math.floor(i / perRow) * cellH;
	});
}

export function isComplete(s: State) {
	return s.pieces.every((p) => p.group === s.pieces[0]?.group);
}
