// Piece shapes are derived from (seed, rows, cols), so every client cuts the
// same puzzle locally from the image URL — the server never touches pixels.

/** Edge sign: 1 = tab out, -1 = blank (hole), 0 = flat border. */
export type Edge = -1 | 0 | 1;
/** [top, right, bottom, left] */
export type PieceEdges = [Edge, Edge, Edge, Edge];

/** Tabs stick out this fraction of min(w, h); renderers pad piece textures by it. */
export const TAB_SIZE = 0.26;

// biome-ignore-start lint/style/noMagicNumbers: mulberry32's own constants.
export function seededRandom(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
// biome-ignore-end lint/style/noMagicNumbers: mulberry32's own constants.

/** Chance an inner edge is a tab on the first piece's side. */
const TAB_OUT_CHANCE = 0.5;

export function generateEdges(
	seed: number,
	rows: number,
	cols: number,
): PieceEdges[] {
	const random = seededRandom(seed);
	const flip = (): Edge => (random() < TAB_OUT_CHANCE ? 1 : -1);
	// horizontal[r][c]: edge between row r-1 and r; vertical[r][c]: edge between col c-1 and c.
	const horizontal = Array.from({ length: rows + 1 }, (_, r) =>
		Array.from({ length: cols }, () => (r === 0 || r === rows ? 0 : flip())),
	);
	const vertical = Array.from({ length: rows }, () =>
		Array.from({ length: cols + 1 }, (_, c) =>
			c === 0 || c === cols ? 0 : flip(),
		),
	);
	// The neighbour sees the same edge from the other side (and never -0).
	const flipSide = (e = 0) => (e === 0 ? 0 : -e) as Edge;
	const edges: PieceEdges[] = [];
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			edges.push([
				flipSide(horizontal[r]?.[c]),
				(vertical[r]?.[c + 1] ?? 0) as Edge,
				(horizontal[r + 1]?.[c] ?? 0) as Edge,
				flipSide(vertical[r]?.[c]),
			]);
		}
	}
	return edges;
}

// One tab as cubic beziers in (u along edge, v outward). Symmetric under
// u -> 1-u, so both neighbours trace the same curve from either direction.
// ponytail: every tab has the same shape; add per-edge seeded jitter if it looks too uniform.
// biome-ignore-start lint/style/noMagicNumbers: control points of the tab's outline.
const TAB_CURVE: [number, number][][] = [
	[
		[0.35, 0],
		[0.4, 0.05],
		[0.38, 0.1],
	],
	[
		[0.34, 0.18],
		[0.4, 0.26],
		[0.5, 0.26],
	],
	[
		[0.6, 0.26],
		[0.66, 0.18],
		[0.62, 0.1],
	],
	[
		[0.6, 0.05],
		[0.65, 0],
		[1, 0],
	],
];
// biome-ignore-end lint/style/noMagicNumbers: control points of the tab's outline.

/** Path coordinates keep two decimals. */
const PRECISION = 100;
const round2 = (n: number) => Math.round(n * PRECISION) / PRECISION;

/** SVG path of a piece with its cell's top-left at (0,0). Works with Skia and PixiJS. */
export function piecePath(edges: PieceEdges, w: number, h: number): string {
	const size = Math.min(w, h);
	const corners: [number, number][] = [
		[0, 0],
		[w, 0],
		[w, h],
		[0, h],
	];
	let d = "M0,0";
	for (let i = 0; i < corners.length; i++) {
		const [ax, ay] = corners[i] as [number, number];
		const [bx, by] = corners[(i + 1) % corners.length] as [number, number];
		const sign = edges[i] ?? 0;
		if (sign === 0) {
			d += `L${round2(bx)},${round2(by)}`;
			continue;
		}
		// Clockwise in y-down coords: outward normal of (dx, dy) is (dy, -dx).
		const dx = (bx - ax) / (Math.abs(bx - ax) + Math.abs(by - ay));
		const dy = (by - ay) / (Math.abs(bx - ax) + Math.abs(by - ay));
		const pt = ([u, v]: [number, number]) =>
			`${round2(ax + u * (bx - ax) + v * sign * size * dy)},${round2(ay + u * (by - ay) - v * sign * size * dx)}`;
		for (const seg of TAB_CURVE) d += `C${seg.map(pt).join(" ")}`;
	}
	return `${d}Z`;
}

export type GridOption = { rows: number; cols: number; count: number };

// biome-ignore-start lint/style/noMagicNumbers: the piece counts offered to players.
const TARGETS = [24, 48, 96, 150, 300, 500, 750, 1000];
// biome-ignore-end lint/style/noMagicNumbers: the piece counts offered to players.

/** Fewest pieces along a side. */
const MIN_SIDE = 2;
/** How far from square a piece may be (width / height, either way). */
const MAX_ASPECT = 1.25;

/** Piece counts that fit the image with near-square pieces. */
export function gridOptions(imageW: number, imageH: number): GridOption[] {
	const out: GridOption[] = [];
	for (const n of TARGETS) {
		const rows = Math.max(
			MIN_SIDE,
			Math.round(Math.sqrt((n * imageH) / imageW)),
		);
		const cols = Math.max(MIN_SIDE, Math.round(n / rows));
		const aspect = imageW / cols / (imageH / rows);
		const count = rows * cols;
		if (
			aspect >= 1 / MAX_ASPECT &&
			aspect <= MAX_ASPECT &&
			!out.some((o) => o.count === count)
		) {
			out.push({ rows, cols, count });
		}
	}
	return out;
}
