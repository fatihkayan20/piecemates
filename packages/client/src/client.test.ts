import assert from "node:assert/strict";
import { mock, test } from "node:test";

import {
	createState,
	gridOptions,
	type ServerMsg,
	tableRect,
} from "@piecemates/game";

import {
	CONFETTI_COUNT,
	type Cue,
	clampCamera,
	debounce,
	defaultGrid,
	finishDrag,
	fitCamera,
	formatDuration,
	frameCamera,
	imageSrc,
	imageSrcSet,
	loadCues,
	loadSettings,
	makeConfetti,
	pinchCamera,
	ROW_IMAGE_SIZE,
	RoomConnection,
	type RoomEvent,
	resizeCamera,
	setBackground,
	setHaptics,
	settingsStore,
	zoomAt,
} from "./index.ts";

test("camera fits the table and zooms around a fixed point", () => {
	const state = createState({ seed: 1, rows: 2, cols: 2, w: 100, h: 100 });
	const bounds = tableRect(state);
	const viewport = { width: 800, height: 600 };
	const cam = fitCamera(bounds, viewport);
	const left = cam.x + bounds.x * cam.scale;
	const right = cam.x + (bounds.x + bounds.width) * cam.scale;
	assert.ok(Math.abs(left - (800 - right)) < 1e-9, "centred horizontally");

	const zoomed = zoomAt(cam, 400, 300, 2, bounds, viewport);
	const before = (400 - cam.x) / cam.scale;
	const after = (400 - zoomed.x) / zoomed.scale;
	assert.ok(Math.abs(before - after) < 1e-9, "focus point stays put");
	assert.equal(zoomAt(cam, 0, 0, 1e9, bounds, viewport).scale, 4, "max zoom");
	assert.equal(
		zoomAt(cam, 0, 0, 1e-9, bounds, viewport).scale,
		cam.scale,
		"can't zoom out past the whole table",
	);
	const panned = clampCamera({ ...zoomed, x: 1e6, y: -1e6 }, bounds, viewport);
	const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
	// Panning stops a little past the edges, so edge pieces stay easy to reach.
	const pad = 32;
	assert.ok(near(panned.x, pad - bounds.x * zoomed.scale), "left edge padded");
	assert.ok(
		near(
			panned.y,
			viewport.height - pad - (bounds.y + bounds.height) * zoomed.scale,
		),
		"bottom edge padded",
	);
});

test("frames and pinches keep pieces usable", () => {
	const viewport = { width: 400, height: 800 };
	const piece = { w: 100, h: 100 };
	const big = createState({ seed: 1, rows: 26, cols: 38, ...piece });
	const table = tableRect(big);
	const start = fitCamera(table, viewport);

	const one = { x: 0, y: 0, width: 100, height: 100 };
	assert.equal(frameCamera(one, piece, viewport).scale, 1.2, "capped zoom");

	const from = { x: 100, y: 100 };
	const to = { x: 150, y: 120 };
	const pinched = pinchCamera(start, from, to, 2, table, viewport);
	const under = (c: typeof start, p: typeof from) => ({
		x: (p.x - c.x) / c.scale,
		y: (p.y - c.y) / c.scale,
	});
	const a = under(start, from);
	const b = under(pinched, to);
	assert.ok(
		Math.abs(a.x - b.x) + Math.abs(a.y - b.y) < 1e-9,
		"the table point under the fingers stays under them",
	);
	assert.equal(pinched.scale, start.scale * 2);
});

test("connection applies server messages and tracks status", () => {
	const sent: string[] = [];
	const socket = {
		readyState: WebSocket.OPEN,
		send: (data: string) => sent.push(data),
		close() {},
	} as unknown as WebSocket;
	const events: RoomEvent[] = [];
	const sounds: Cue[] = [];
	const buzzes: Cue[] = [];
	loadCues({ sound: (c) => sounds.push(c), haptic: (c) => buzzes.push(c) });
	setHaptics(false);
	const room = new RoomConnection(socket, (e) => events.push(e));
	const deliver = (msg: ServerMsg) =>
		socket.onmessage?.({ data: JSON.stringify(msg) } as MessageEvent);

	const state = createState({ seed: 1, rows: 1, cols: 2, w: 100, h: 100 });
	deliver({ type: "state", state, you: "a" });
	assert.equal(room.me, "a");
	assert.equal(room.status, "playing");

	room.send({ type: "lock", piece: 0 });
	assert.equal(sent.length, 1);

	deliver({ type: "applied", by: "a", msg: { type: "lock", piece: 0 } });
	deliver({
		type: "applied",
		by: "a",
		msg: { type: "drop", piece: 0, x: 0, y: 0 },
	});
	deliver({ type: "applied", by: "a", msg: { type: "lock", piece: 1 } });
	deliver({
		type: "applied",
		by: "a",
		msg: { type: "drop", piece: 1, x: 100, y: 0 },
	});
	assert.equal(room.status, "done");
	assert.equal(events.length, 5);
	assert.deepEqual(sounds, ["snap", "win"], "board snap, then the win");
	assert.deepEqual(buzzes, [], "haptics off");
	setHaptics(true);

	const other = createState({ seed: 2, rows: 3, cols: 3, w: 100, h: 100 });
	deliver({ type: "state", state: other, you: "a" });
	deliver({ type: "applied", by: "b", msg: { type: "lock", piece: 0 } });
	const shared = { ...other.pieces[1] };
	room.tidy();
	assert.equal(events.at(-1)?.type, "tidied");
	assert.ok(sent.length === 1, "tidy is local, nothing sent");
	assert.deepEqual(other.pieces[1], shared, "shared state untouched");
	const held = other.pieces[0];
	assert.deepEqual(
		room.position(0),
		{ x: held?.x, y: held?.y },
		"held piece not moved",
	);

	// Views are local: a bag view shows the bag, a tidy there moves only its pile.
	const bag = { bag: "sky", name: "Sky", color: "#38bdf8" };
	deliver({ type: "applied", by: "b", msg: { type: "bag:create", ...bag } });
	deliver({
		type: "applied",
		by: "b",
		msg: { type: "bag:put", piece: 4, bag: "sky" },
	});
	assert.ok(room.visible(3) && !room.visible(4), "table view");
	room.setView("sky");
	assert.equal(events.at(-1)?.type, "view");
	assert.ok(room.visible(4) && !room.visible(3), "bag view");
	const tableSpot = room.position(3);
	room.tidy();
	assert.deepEqual(room.position(3), tableSpot, "table pile left alone");
	deliver({
		type: "applied",
		by: "b",
		msg: { type: "bag:delete", bag: "sky" },
	});
	assert.equal(room.view, null, "deleted bag sends me back to the table");
	assert.ok(sent.length === 1, "views and tidy send nothing");

	const clock = { played: 65_000, since: null };
	deliver({ type: "clock", clock });
	assert.deepEqual(room.state?.clock, clock, "server clock replaces mine");
	assert.equal(formatDuration(65_000), "1:05");
	assert.equal(formatDuration(3_725_000), "1:02:05");

	socket.onclose?.({} as CloseEvent);
	assert.equal(room.status, "disconnected");
});

test("settings load from and save to the given storage", async () => {
	const saved = new Map([
		["piecemates-settings", JSON.stringify({ state: { background: "#111" } })],
	]);
	await loadSettings({
		getItem: (k) => saved.get(k) ?? null,
		setItem: (k, v) => void saved.set(k, v),
		removeItem: (k) => void saved.delete(k),
	});
	assert.equal(settingsStore.getState().background, "#111");
	setBackground("#222");
	assert.equal(
		settingsStore.getState().background,
		"#111",
		"not a table colour",
	);
	setBackground("#14532d");
	assert.match(saved.get("piecemates-settings") ?? "", /#14532d/);
});

test("confetti starts across the width in every bag colour", () => {
	const pieces = makeConfetti();
	assert.equal(pieces.length, CONFETTI_COUNT);
	assert.ok(pieces.every((p) => p.x >= 0 && p.x <= 1 && p.duration > 0));
	assert.equal(new Set(pieces.map((p) => p.color)).size, 6);
});

test("a resize keeps the zoom and the centre point", () => {
	const state = createState({ seed: 1, rows: 2, cols: 2, w: 100, h: 100 });
	const bounds = tableRect(state);
	const big = { width: 800, height: 600 };
	const small = { width: 400, height: 300 };
	const fitted = fitCamera(bounds, big);
	const refit = resizeCamera(
		fitted,
		{ table: bounds, viewport: big },
		{ table: bounds, viewport: small },
	);
	assert.deepEqual(
		refit,
		fitCamera(bounds, small),
		"a fitted table stays fitted",
	);

	const zoomed = zoomAt(fitted, 400, 300, 2, bounds, big);
	const moved = resizeCamera(
		zoomed,
		{ table: bounds, viewport: big },
		{ table: bounds, viewport: small },
	);
	const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
	assert.ok(near(moved.scale, refit.scale * 2), "zoom kept relative to fit");
	assert.ok(
		near((200 - moved.x) / moved.scale, (400 - zoomed.x) / zoomed.scale),
		"centre point kept",
	);

	const tall = {
		...bounds,
		y: bounds.y - bounds.height,
		height: bounds.height * 3,
	};
	const portrait = { width: 300, height: 600 };
	const turned = resizeCamera(
		fitted,
		{ table: bounds, viewport: big },
		{ table: tall, viewport: portrait },
	);
	assert.deepEqual(
		turned,
		fitCamera(tall, portrait),
		"a fitted table stays fitted when my table changes shape",
	);
});

test("debounce runs once after the calls stop, and cancel drops it", () => {
	mock.timers.enable({ apis: ["setTimeout"] });
	let runs = 0;
	const bump = debounce(() => runs++, 100);
	bump();
	mock.timers.tick(50);
	bump();
	mock.timers.tick(99);
	assert.equal(runs, 0, "still waiting after the second call");
	mock.timers.tick(1);
	assert.equal(runs, 1);
	bump();
	bump.cancel();
	mock.timers.tick(200);
	assert.equal(runs, 1, "cancelled");
	mock.timers.reset();
});

test("images are asked for at the width they show at", () => {
	const ours = "https://api.example.com/images/abc";
	assert.equal(imageSrc(ours, ROW_IMAGE_SIZE, 3), `${ours}?w=512`);
	assert.equal(
		imageSrc("https://images.unsplash.com/p?w=1600&q=80", 400, 2),
		"https://images.unsplash.com/p?w=1024&q=80",
	);
	assert.equal(imageSrc("blob:http://x/1", 400, 2), "blob:http://x/1");
	assert.match(imageSrcSet(ours) ?? "", /w=256 256w, .*w=3072 3072w$/);
	assert.equal(imageSrcSet("blob:http://x/1"), undefined);
});

test("each screen draws its own pile; a drop places pile partners first", () => {
	const sent: { type: string; piece?: number; x?: number; y?: number }[] = [];
	const socket = () =>
		({
			readyState: WebSocket.OPEN,
			send: (data: string) => sent.push(JSON.parse(data)),
			close() {},
		}) as unknown as WebSocket;
	const state = createState({ seed: 4, rows: 4, cols: 6, w: 100, h: 100 });
	const open = (aspect: number) => {
		const s = socket();
		const conn = new RoomConnection(s, () => {});
		conn.setAspect(aspect);
		const hello = { type: "state", state: structuredClone(state), you: "a" };
		s.onmessage?.({ data: JSON.stringify(hello) } as MessageEvent);
		return conn;
	};
	const phone = open(0.5);
	const mac = open(2);
	const inside = (conn: RoomConnection, i: number) => {
		const p = conn.position(i);
		const t = conn.pile.table(conn.state as typeof state);
		return (
			p.x >= t.x && p.y >= t.y && p.x <= t.x + t.width && p.y <= t.y + t.height
		);
	};
	const tall = phone.pile.table(state);
	const wide = mac.pile.table(state);
	assert.ok(tall.width / tall.height < wide.width / wide.height, "own shapes");
	assert.ok(state.pieces.every((_, i) => inside(phone, i) && inside(mac, i)));

	// On the phone, drop piece 0 just left of where the phone shows piece 1.
	const seen = phone.position(1);
	const drag = { piece: 0, starts: new Map([[0, phone.position(0)]]) };
	const start = drag.starts.get(0) as { x: number; y: number };
	finishDrag(phone, drag, null, seen.x - 100 - start.x + 4, seen.y - start.y);
	assert.deepEqual(
		sent.map((m) => [m.type, m.piece]),
		[
			["lock", 1],
			["drop", 1],
			["lock", 0],
			["drop", 0],
		],
		"piece 1 lands where the phone shows it, then 0 snaps to it",
	);
	assert.deepEqual({ x: sent[1]?.x, y: sent[1]?.y }, seen);
});

test("phones default to fewer pieces than bigger screens", () => {
	const options = gridOptions(1600, 1200);
	const phone = defaultGrid(options, { width: 390, height: 844 });
	const desktop = defaultGrid(options, { width: 1440, height: 900 });
	assert.ok(phone && desktop && phone.count < desktop.count);
	assert.ok(phone.count >= 40 && phone.count <= 60);
});
