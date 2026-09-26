import assert from "node:assert/strict";
import { test } from "node:test";

import { createState, type ServerMsg } from "@piecemates/game";

import {
	type Camera,
	canPickUp,
	connectRoom,
	DROP_TABLE,
	disconnectRoom,
	dropTargetAt,
	endsDrag,
	finishDrag,
	fitCamera,
	followRoom,
	measureDropTargets,
	registerDropTarget,
	roomStore,
	startDrag,
} from "./index.ts";

test("store mirrors the room; drags pick up, drop and settle", () => {
	const sent: { type: string }[] = [];
	const socket = {
		readyState: WebSocket.OPEN,
		send: (data: string) => sent.push(JSON.parse(data)),
		close() {},
	} as unknown as WebSocket;
	const conn = connectRoom(socket);
	const deliver = (msg: ServerMsg) =>
		socket.onmessage?.({ data: JSON.stringify(msg) } as MessageEvent);

	const state = createState({ seed: 1, rows: 2, cols: 2, w: 100, h: 100 });
	deliver({ type: "state", state, you: "a" });
	const bag = { bag: "sky", name: "Sky", color: "#38bdf8" };
	deliver({ type: "applied", by: "b", msg: { type: "bag:create", ...bag } });
	deliver({
		type: "applied",
		by: "b",
		msg: { type: "bag:put", piece: 3, bag: "sky" },
	});
	const snap = roomStore.getState();
	assert.equal(snap.status, "playing");
	assert.deepEqual(snap.bags, [
		{ id: "sky", name: "Sky", color: "#38bdf8", count: 1 },
	]);
	assert.ok(canPickUp(conn, 0) && !canPickUp(conn, 3), "bagged piece hidden");
	deliver({ type: "applied", by: "b", msg: { type: "lock", piece: 1 } });
	const locked = roomStore.getState().pieces;
	assert.equal(locked[0], snap.pieces[0], "untouched piece keeps its object");
	assert.ok(locked[1]?.held && locked[1] !== snap.pieces[1]);
	deliver({ type: "applied", by: "b", msg: { type: "unlock", piece: 1 } });

	const drag = startDrag(0);
	assert.ok(drag);
	assert.equal(roomStore.getState().order.at(-1), 0, "grabbed group on top");
	finishDrag(conn, drag, null, 10, 0);
	finishDrag(conn, drag, "sky", 0, 0);
	finishDrag(conn, drag, DROP_TABLE, 0, 0);
	assert.deepEqual(
		sent.map((m) => m.type),
		["lock", "drop", "bag:put", "bag:put"],
	);
	const drop = { type: "drop", piece: 0, x: 0, y: 0 } as const;
	assert.ok(endsDrag({ type: "applied", by: "a", msg: drop }, "a", 0));
	assert.ok(!endsDrag({ type: "applied", by: "b", msg: drop }, "a", 0));
	assert.ok(endsDrag({ type: "rejected", msg: drop }, "a", 0));

	deliver({ type: "applied", by: "a", msg: { type: "lock", piece: 0 } });
	deliver({
		type: "applied",
		by: "a",
		msg: { type: "drop", piece: 0, x: -200, y: -200 },
	});
	assert.equal(roomStore.getState().drag, null, "echoed drop ends the drag");
	assert.deepEqual(
		[roomStore.getState().pieces[0]?.x, roomStore.getState().pieces[0]?.y],
		[-200, -200],
	);

	// A refused bag:put unlocks the piece again.
	deliver({ type: "rejected", msg: { type: "bag:put", piece: 0, bag: "x" } });
	assert.equal(sent.at(-1)?.type, "unlock");

	const off = registerDropTarget("sky", (done) =>
		done({ x: 0, y: 0, width: 50, height: 20 }),
	);
	const rects = measureDropTargets();
	assert.equal(dropTargetAt(rects, 10, 10), "sky");
	assert.equal(dropTargetAt(rects, 60, 10), null);
	off();
	assert.equal(measureDropTargets().size, 0);

	disconnectRoom(conn);
	assert.equal(roomStore.getState().conn, null);
});

test("the camera starts, frames a bag, returns, and shows the win", () => {
	const socket = {
		readyState: WebSocket.OPEN,
		send() {},
		close() {},
	} as unknown as WebSocket;
	let camera: Camera = { x: 0, y: 0, scale: 1 };
	const sets: Camera[] = [];
	const viewport = { width: 800, height: 600 };
	const unfollow = followRoom({
		get: () => camera,
		set: (c) => {
			camera = c;
			sets.push(c);
		},
		viewport: () => viewport,
	});
	const conn = connectRoom(socket);
	const deliver = (msg: ServerMsg) =>
		socket.onmessage?.({ data: JSON.stringify(msg) } as MessageEvent);
	const state = createState({ seed: 1, rows: 2, cols: 2, w: 100, h: 100 });
	deliver({ type: "state", state, you: "a" });
	assert.equal(sets.length, 1, "start view");
	const table = { ...camera, x: camera.x + 5 };
	camera = table;

	const bag = { bag: "sky", name: "Sky", color: "#38bdf8" };
	deliver({ type: "applied", by: "a", msg: { type: "bag:create", ...bag } });
	deliver({
		type: "applied",
		by: "a",
		msg: { type: "bag:put", piece: 0, bag: "sky" },
	});
	conn.setView("sky");
	assert.equal(camera.scale, 1.2, "one bag piece, framed at the capped zoom");
	conn.setView(null);
	assert.deepEqual(camera, table, "back where I was on the table");

	const board = { x: 0, y: 0, width: 200, height: 200 };
	for (const [piece, x, y] of [
		[0, 0, 0],
		[1, 100, 0],
		[2, 0, 100],
		[3, 100, 100],
	] as const) {
		deliver({ type: "applied", by: "a", msg: { type: "lock", piece } });
		deliver({ type: "applied", by: "a", msg: { type: "drop", piece, x, y } });
	}
	assert.equal(roomStore.getState().status, "done");
	assert.deepEqual(camera, fitCamera(board, viewport), "whole picture");
	unfollow();
	disconnectRoom(conn);
});
