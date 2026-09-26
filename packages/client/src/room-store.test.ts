import assert from "node:assert/strict";
import { test } from "node:test";

import { createState, type ServerMsg } from "@piecemates/game";

import {
	canPickUp,
	connectRoom,
	DROP_TABLE,
	disconnectRoom,
	dropTargetAt,
	endsDrag,
	finishDrag,
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
