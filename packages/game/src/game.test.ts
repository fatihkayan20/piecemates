import assert from "node:assert/strict";
import { test } from "node:test";

import {
	apply,
	ClientMsg,
	createState,
	generateEdges,
	gridOptions,
	isComplete,
	piecePath,
	tableRect,
	tidyPositions,
	visibleIn,
} from "./index.ts";

test("neighbouring edges interlock and borders are flat", () => {
	const rows = 3;
	const cols = 4;
	const e = generateEdges(42, rows, cols);
	assert.deepEqual(e, generateEdges(42, rows, cols), "deterministic");
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const [top, right, bottom, left] = e[r * cols + c] ?? [];
			if (r === 0) assert.equal(top, 0);
			if (c === 0) assert.equal(left, 0);
			if (r === rows - 1) assert.equal(bottom, 0);
			else assert.equal(bottom, -(e[(r + 1) * cols + c]?.[0] ?? 0));
			if (c === cols - 1) assert.equal(right, 0);
			else assert.equal(right, -(e[r * cols + c + 1]?.[3] ?? 0));
		}
	}
	assert.match(piecePath(e[5] ?? [0, 0, 0, 0], 100, 100), /^M0,0.*Z$/);
});

test("grid options keep pieces near square", () => {
	const opts = gridOptions(1600, 900);
	assert.ok(opts.length > 3);
	for (const o of opts)
		assert.ok(o.count <= 1100 && 1600 / o.cols / (900 / o.rows) < 1.25);
});

test("locks, drop, snap, completion", () => {
	const s = createState({ seed: 1, rows: 1, cols: 2, w: 100, h: 100 });
	assert.equal(
		new Set(s.pieces.map((p) => `${p.x},${p.y}`)).size,
		2,
		"no stacking",
	);

	assert.ok(apply(s, "a", { type: "lock", piece: 0 }));
	assert.equal(
		apply(s, "b", { type: "lock", piece: 0 }),
		false,
		"lock conflict",
	);
	assert.equal(
		apply(s, "b", { type: "drop", piece: 0, x: 0, y: 0 }),
		false,
		"drop without lock",
	);
	assert.ok(apply(s, "a", { type: "drop", piece: 0, x: 0, y: 0 }));
	assert.equal(s.locks[0], undefined, "drop releases");

	// Piece 1 belongs at (100, 0); drop it close enough to snap.
	assert.ok(apply(s, "b", { type: "lock", piece: 1 }));
	assert.ok(apply(s, "b", { type: "drop", piece: 1, x: 110, y: -8 }));
	assert.deepEqual(
		s.pieces.map((p) => [p.x, p.y]),
		[
			[0, 0],
			[100, 0],
		],
	);
	assert.ok(isComplete(s));
});

test("leave releases locks", () => {
	const s = createState({ seed: 7, rows: 2, cols: 2, w: 10, h: 10 });
	apply(s, "a", { type: "lock", piece: 3 });
	apply(s, "a", { type: "leave" });
	assert.deepEqual(s.locks, {});
});

test("bags keep their groups and hand them to the puzzle on snap", () => {
	const s = createState({ seed: 5, rows: 2, cols: 2, w: 100, h: 100 });
	const bag = { bag: "sky", name: "Sky", color: "#38bdf8" };
	assert.ok(apply(s, "a", { type: "bag:create", ...bag }));
	assert.equal(apply(s, "a", { type: "bag:create", ...bag }), false, "twice");
	assert.equal(
		apply(s, "a", { type: "bag:put", piece: 0, bag: "nope" }),
		false,
		"unknown bag",
	);

	assert.ok(apply(s, "a", { type: "bag:put", piece: 0, bag: "sky" }));
	assert.ok(apply(s, "a", { type: "bag:put", piece: 1, bag: "sky" }));
	assert.ok(!visibleIn(s, null).has(0), "hidden on the table");
	assert.deepEqual([...visibleIn(s, "sky")], [0, 1]);

	// Join 0 and 1 inside the bag: they stay in it.
	const p0 = s.pieces[0] as { x: number; y: number };
	apply(s, "a", { type: "lock", piece: 1 });
	apply(s, "a", { type: "drop", piece: 1, x: p0.x + 100, y: p0.y });
	assert.equal(s.pieces[1]?.group, s.pieces[0]?.group);
	assert.equal(s.pieces[1]?.bag, "sky", "a drop keeps the bag");

	// Piece 2 on the board is part of the puzzle, so the bag view shows it.
	apply(s, "b", { type: "lock", piece: 2 });
	apply(s, "b", { type: "drop", piece: 2, x: 0, y: 100 });
	assert.ok(visibleIn(s, "sky").has(2));
	assert.ok(!visibleIn(s, "sky").has(3), "loose table pieces hidden");
	apply(s, "a", { type: "lock", piece: 0 });
	apply(s, "a", { type: "drop", piece: 0, x: 0, y: 0 });
	assert.deepEqual(
		s.pieces.slice(0, 3).map((p) => p.bag),
		[null, null, null],
		"joined the puzzle",
	);

	// Out of a bag and back: a lone piece lands in a free pile slot.
	apply(s, "a", { type: "bag:put", piece: 3, bag: "sky" });
	assert.ok(apply(s, "a", { type: "bag:put", piece: 3, bag: null }));
	assert.equal(s.pieces[3]?.touched, false);
	apply(s, "a", { type: "bag:put", piece: 3, bag: "sky" });
	assert.ok(apply(s, "a", { type: "bag:delete", bag: "sky" }));
	assert.equal(s.pieces[3]?.bag, null, "delete empties the bag");
	assert.deepEqual(s.bags, {});
});

test("bag slots don't stack; placing on the board leaves the bag", () => {
	const s = createState({ seed: 2, rows: 3, cols: 3, w: 100, h: 100 });
	apply(s, "a", { type: "bag:create", bag: "sky", name: "Sky", color: "#fff" });
	apply(s, "a", { type: "bag:put", piece: 0, bag: "sky" });
	// Nudge piece 0 inside the bag: it's touched but still sits on its slot.
	const p0 = s.pieces[0] as { x: number; y: number };
	apply(s, "a", { type: "lock", piece: 0 });
	apply(s, "a", { type: "drop", piece: 0, x: p0.x + 5, y: p0.y });
	apply(s, "a", { type: "bag:put", piece: 1, bag: "sky" });
	const p1 = s.pieces[1] as { x: number; y: number };
	assert.ok(
		Math.abs(p1.x - p0.x) >= 100 || Math.abs(p1.y - p0.y) >= 100,
		"next piece gets another slot",
	);

	apply(s, "a", { type: "lock", piece: 1 });
	apply(s, "a", { type: "drop", piece: 1, x: 100, y: 0 });
	assert.equal(s.pieces[1]?.bag, null, "on the board = in the puzzle");
	assert.equal(s.pieces[0]?.bag, "sky");
});

test("protocol rejects bad input", () => {
	assert.equal(
		ClientMsg.safeParse({ type: "drop", piece: -1, x: 0, y: 0 }).success,
		false,
	);
	assert.equal(
		ClientMsg.safeParse({ type: "drop", piece: 1, x: Number.NaN, y: 0 })
			.success,
		false,
	);
	assert.equal(
		ClientMsg.safeParse({ type: "leave" }).success,
		false,
		"leave is server-only",
	);
});

test("pile rings the board, drops stay on the table, tidy is stable", () => {
	const s = createState({ seed: 3, rows: 20, cols: 30, w: 100, h: 90 });
	const board = { w: 30 * 100, h: 20 * 90 };
	const t = tableRect(s);
	for (const p of s.pieces) {
		const onBoard =
			p.x + 100 > 0 && p.x < board.w && p.y + 90 > 0 && p.y < board.h;
		assert.ok(!onBoard, "pile starts off the board");
		const gapX = Math.max(-(p.x + 100), p.x - board.w);
		const gapY = Math.max(-(p.y + 90), p.y - board.h);
		assert.ok(Math.max(gapX, gapY) >= 2 * 1.6 * 90, "free space by the board");
		assert.ok(p.x >= t.x && p.y >= t.y, "inside the table");
		assert.ok(p.x + 100 <= t.x + t.width && p.y + 90 <= t.y + t.height);
	}
	const spots = new Set(s.pieces.map((p) => `${p.x},${p.y}`));
	assert.equal(spots.size, s.pieces.length, "one piece per slot");
	assert.ok(
		s.pieces.some((p) => p.y < 0),
		"pieces above the board too",
	);

	assert.ok(apply(s, "a", { type: "lock", piece: 7 }));
	assert.ok(apply(s, "a", { type: "drop", piece: 7, x: 1e6, y: -1e6 }));
	const p7 = s.pieces[7];
	assert.equal(p7?.x, t.x + t.width - 100, "clamped to the right edge");
	assert.equal(p7?.y, t.y, "clamped to the top edge");

	const at = (i: number) => s.pieces[i] as { x: number; y: number };
	const once = tidyPositions(s, null, at);
	assert.ok(!once.has(7), "touched pieces stay put");
	const twice = tidyPositions(s, null, (i) => once.get(i) ?? at(i));
	assert.deepEqual([...twice], [...once], "tidying again changes nothing");
});
