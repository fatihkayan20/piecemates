import assert from "node:assert/strict";
import { test } from "node:test";

import {
	apply,
	ClientMsg,
	createState,
	elapsed,
	generateEdges,
	gridOptions,
	isComplete,
	MAX_BAGS,
	needsName,
	pause,
	piecePath,
	resume,
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

test("bag slots don't stack; a loose drop on the board stays in the bag", () => {
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

	// Trying a wrong spot on the board isn't placing it.
	apply(s, "a", { type: "lock", piece: 1 });
	apply(s, "a", { type: "drop", piece: 1, x: 100, y: 100 });
	assert.equal(s.pieces[1]?.bag, "sky", "still in the bag");
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

test("frame pieces stick to their spot on the board and leave their bag", () => {
	const s = createState({ seed: 1, rows: 3, cols: 3, w: 100, h: 100 });
	const drop = (piece: number, x: number, y: number) => {
		assert.ok(apply(s, "a", { type: "lock", piece }));
		assert.ok(apply(s, "a", { type: "drop", piece, x, y }));
	};

	drop(2, 215, 10); // top-right corner, near (200, 0)
	assert.deepEqual([s.pieces[2]?.x, s.pieces[2]?.y], [200, 0]);
	assert.equal(apply(s, "a", { type: "lock", piece: 2 }), false, "placed");
	assert.equal(
		apply(s, "a", { type: "bag:put", piece: 2, bag: null }),
		false,
		"placed",
	);
	drop(4, 110, 110); // the middle piece never sticks
	assert.deepEqual([s.pieces[4]?.x, s.pieces[4]?.y], [110, 110]);
	drop(0, 60, 0); // too far
	assert.equal(s.pieces[0]?.x, 60);

	assert.ok(
		apply(s, "a", { type: "bag:create", bag: "b", name: "B", color: "" }),
	);
	assert.ok(apply(s, "a", { type: "bag:put", piece: 6, bag: "b" }));
	drop(6, -10, 190); // bottom-left corner, near (0, 200)
	assert.deepEqual(
		[s.pieces[6]?.x, s.pieces[6]?.y, s.pieces[6]?.bag],
		[0, 200, null],
	);
	assert.ok(apply(s, "a", { type: "bag:put", piece: 8, bag: "b" }));
	drop(8, 200, 200); // exactly on its spot, so nothing moves
	assert.equal(s.pieces[8]?.bag, null, "a placed piece leaves its bag too");
});

test("the clock only runs while someone is in an unsolved room", () => {
	const s = createState({ seed: 1, rows: 1, cols: 2, w: 100, h: 100 });
	resume(s, 1000);
	resume(s, 1500); // a second player joining doesn't restart it
	assert.equal(elapsed(s.clock, 3000), 2000, "running");
	pause(s, 3000);
	pause(s, 9000); // already paused
	assert.equal(elapsed(s.clock, 9000), 2000, "paused");
	resume(s, 10000);
	for (const piece of [0, 1]) {
		assert.ok(apply(s, "a", { type: "lock", piece }));
		assert.ok(apply(s, "a", { type: "drop", piece, x: piece * 100, y: 0 }));
	}
	assert.ok(isComplete(s));
	pause(s, 10500);
	resume(s, 20000); // solved rooms stay stopped
	assert.equal(elapsed(s.clock, 30000), 2500, "solved");
});

test("rotation rooms: pieces start turned, turn in groups and only join the same way up", () => {
	const plain = createState({ seed: 3, rows: 4, cols: 4, w: 100, h: 100 });
	assert.ok(plain.pieces.every((p) => p.rot === 0));
	assert.equal(apply(plain, "a", { type: "rotate", piece: 0 }), false);
	const turned = createState({
		seed: 3,
		rows: 4,
		cols: 4,
		w: 100,
		h: 100,
		rotate: true,
	});
	assert.ok(
		turned.pieces.some((p) => p.rot !== 0),
		"some start turned",
	);

	const s = createState({
		seed: 1,
		rows: 1,
		cols: 2,
		w: 100,
		h: 100,
		rotate: true,
	});
	const [a, b] = s.pieces;
	assert.ok(a && b);
	Object.assign(a, { x: 300, y: 300, rot: 1, touched: true });
	Object.assign(b, { x: 305, y: 395, rot: 0, touched: true });
	assert.ok(apply(s, "p", { type: "lock", piece: 1 }));
	assert.ok(apply(s, "p", { type: "drop", piece: 1, x: 305, y: 395 }));
	assert.notEqual(b.group, a.group, "different turns don't join");

	assert.ok(apply(s, "q", { type: "lock", piece: 1 }));
	assert.equal(apply(s, "p", { type: "rotate", piece: 1 }), false, "held");
	assert.ok(apply(s, "q", { type: "rotate", piece: 1 }), "my own lock");
	assert.equal(s.locks[b.group], undefined, "turning lets go");
	// Piece 1 sits right of piece 0; turned a quarter, that's below it.
	assert.equal(b.group, a.group, "joined once turned the same way");
	assert.deepEqual([b.x, b.y], [300, 400]);

	for (let i = 0; i < 3; i++) apply(s, "p", { type: "rotate", piece: 0 });
	assert.deepEqual(
		s.pieces.map((p) => [p.rot, Math.round(p.x), Math.round(p.y)]),
		[
			[0, 300, 300],
			[0, 400, 300],
		],
		"a group turns around the piece I turned",
	);
	assert.equal(isComplete(s), true, "one group, upright");
	a.rot = 1;
	assert.equal(isComplete(s), false, "not upright yet");
});

test("a guest picks a name before meeting others", () => {
	assert.equal(needsName("Anonymous"), true);
	assert.equal(needsName("  "), true);
	assert.equal(needsName("Ada"), false);
	assert.equal(needsName(" anonymous "), true, "the guest name in any case");
	for (const hidden of ["\u200b", "\u3164", "A\u0000B", "a\nb", "\u202eevil"])
		assert.equal(needsName(hidden), true, JSON.stringify(hidden));
	assert.equal(needsName("Zoë 👩‍💻"), false, "accents and emoji are fine");
	assert.equal(needsName("x".repeat(41)), true);
});

test("bags are own, capped, printable and hex coloured", () => {
	const s = createState({ seed: 1, rows: 2, cols: 2, w: 100, h: 100 });
	for (const bag of ["toString", "constructor"])
		assert.equal(
			apply(s, "a", { type: "bag:put", piece: 0, bag }),
			false,
			`${bag} isn't a bag`,
		);
	const bag = (id: string) => ({
		type: "bag:create",
		bag: id,
		name: "x",
		color: "#38bdf8",
	});
	assert.equal(ClientMsg.safeParse(bag("__proto__")).success, false);
	assert.equal(
		ClientMsg.safeParse({ ...bag("a"), name: "a\u0001" }).success,
		false,
	);
	assert.equal(
		ClientMsg.safeParse({ ...bag("a"), color: "red" }).success,
		false,
	);
	for (let i = 0; i < MAX_BAGS; i++)
		assert.ok(
			apply(s, "a", {
				type: "bag:create",
				bag: `b${i}`,
				name: "x",
				color: "#38bdf8",
			}),
		);
	assert.equal(
		apply(s, "a", {
			type: "bag:create",
			bag: "one",
			name: "x",
			color: "#38bdf8",
		}),
		false,
		"at most MAX_BAGS",
	);
});
