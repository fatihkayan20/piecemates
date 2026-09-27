import { groupOf, isPlaced, lockedByOther, type Point } from "@piecemates/game";

import { DROP_TABLE } from "./drop-targets.ts";
import type { RoomConnection, RoomEvent } from "./room-connection.ts";

/** A group being dragged; `starts`: where each member was drawn when it began. */
export type Drag = { piece: number; starts: Map<number, Point> };

/** Whether I may pick up a piece: shown in my view, not held by someone else, not placed. */
export function canPickUp(conn: RoomConnection, index: number) {
	const state = conn.state;
	return (
		!!state &&
		conn.visible(index) &&
		!lockedByOther(state, index, conn.me) &&
		!isPlaced(state, index)
	);
}

/** Picks up a piece's group and asks the server for the lock. */
export function beginDrag(conn: RoomConnection, piece: number): Drag | null {
	if (!conn.state) return null;
	const members = groupOf(conn.state, piece);
	const starts = new Map(members.map((m) => [m, conn.position(m)]));
	conn.send({ type: "lock", piece });
	return { piece, starts };
}

/**
 * Lets go of a drag moved by (dx, dy) table units: into a bag or back to the
 * table when over a drop target, else onto the table at the new spot.
 */
export function finishDrag(
	conn: RoomConnection,
	drag: Drag,
	target: string | null,
	dx: number,
	dy: number,
) {
	const { piece } = drag;
	const start = drag.starts.get(piece);
	if (target !== null)
		conn.send({
			type: "bag:put",
			piece,
			bag: target === DROP_TABLE ? null : target,
		});
	else if (start)
		conn.send({ type: "drop", piece, x: start.x + dx, y: start.y + dy });
}

/** In a rotation room, turns the tapped piece's group; returns whether it did. */
export function turnPiece(conn: RoomConnection, piece: number) {
	if (!conn.state?.rotate) return false;
	conn.send({ type: "rotate", piece });
	return true;
}

/** Whether an event settles my drag of `piece`: my drop (or turn) echoed back, or refused. */
export function endsDrag(event: RoomEvent, me: string, piece: number) {
	if (event.type === "applied")
		return (
			event.by === me &&
			(event.msg.type === "drop" ||
				event.msg.type === "bag:put" ||
				event.msg.type === "rotate") &&
			event.msg.piece === piece
		);
	return (
		event.type === "rejected" &&
		"piece" in event.msg &&
		event.msg.piece === piece
	);
}
