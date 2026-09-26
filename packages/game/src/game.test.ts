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

test("leave releases locks; bags hold single pieces; tidy skips touched", () => {
	const s = createState({ seed: 7, rows: 2, cols: 2, w: 10, h: 10 });
	apply(s, "a", { type: "lock", piece: 3 });
	apply(s, "a", { type: "leave" });
	assert.deepEqual(s.locks, {});

	assert.ok(apply(s, "a", { type: "bag:create", bag: "edges", name: "Edges" }));
	assert.ok(apply(s, "a", { type: "bag:put", bag: "edges", pieces: [0, 1] }));
	assert.equal(s.pieces[0]?.bag, "edges");
	assert.equal(
		apply(s, "a", { type: "bag:put", bag: "nope", pieces: [2] }),
		false,
	);

	const before = { ...s.pieces[0] };
	apply(s, "a", { type: "tidy" });
	assert.deepEqual(s.pieces[0], before, "bagged piece untouched by tidy");
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
