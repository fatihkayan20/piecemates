import assert from "node:assert/strict";
import { test } from "node:test";

import { createState, type ServerMsg, tableRect } from "@puzzle/game";

import {
	type Cue,
	clampCamera,
	fitCamera,
	loadCues,
	loadSettings,
	RoomConnection,
	type RoomEvent,
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
	assert.ok(near(panned.x, -bounds.x * zoomed.scale), "left edge at screen");
	assert.ok(
		near(panned.y, viewport.height - (bounds.y + bounds.height) * zoomed.scale),
		"bottom edge at screen",
	);
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
	assert.deepEqual(room.position(0), other.pieces[0], "held piece not moved");

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

	socket.onclose?.({} as CloseEvent);
	assert.equal(room.status, "disconnected");
});

test("settings load from and save to the given storage", async () => {
	const saved = new Map([
		["puzzle-settings", JSON.stringify({ state: { background: "#111" } })],
	]);
	await loadSettings({
		getItem: (k) => saved.get(k) ?? null,
		setItem: (k, v) => void saved.set(k, v),
		removeItem: (k) => void saved.delete(k),
	});
	assert.equal(settingsStore.getState().background, "#111");
	setBackground("#222");
	assert.match(saved.get("puzzle-settings") ?? "", /#222/);
});
