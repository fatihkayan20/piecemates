import assert from "node:assert/strict";
import { test } from "node:test";

import { createState, type ServerMsg } from "@puzzle/game";

import {
	fitCamera,
	RoomConnection,
	type RoomEvent,
	tableBounds,
	zoomAt,
} from "./index.ts";

test("camera fits the table and zooms around a fixed point", () => {
	const state = createState({ seed: 1, rows: 2, cols: 2, w: 100, h: 100 });
	const bounds = tableBounds(state);
	assert.equal(bounds.x, 0);
	assert.ok(bounds.height > 200, "includes the pile below the board");

	const cam = fitCamera(bounds, { width: 800, height: 600 });
	const left = cam.x + bounds.x * cam.scale;
	const right = cam.x + (bounds.x + bounds.width) * cam.scale;
	assert.ok(Math.abs(left - (800 - right)) < 1e-9, "centred horizontally");

	const zoomed = zoomAt(cam, 400, 300, 2);
	const before = (400 - cam.x) / cam.scale;
	const after = (400 - zoomed.x) / zoomed.scale;
	assert.ok(Math.abs(before - after) < 1e-9, "focus point stays put");
	assert.equal(zoomAt(cam, 0, 0, 1e9).scale, 4, "clamped");
});

test("connection applies server messages and tracks status", () => {
	const sent: string[] = [];
	const socket = {
		readyState: WebSocket.OPEN,
		send: (data: string) => sent.push(data),
		close() {},
	} as unknown as WebSocket;
	const events: RoomEvent[] = [];
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

	socket.onclose?.({} as CloseEvent);
	assert.equal(room.status, "disconnected");
});
