import { user } from "@piecemates/db/schema/auth";
import { roomPlayers, rooms } from "@piecemates/db/schema/game";
import { and, desc, eq, inArray, ne } from "drizzle-orm";

import { getDb } from "./services";

/** Most rooms a history answer lists, newest first. */
const HISTORY_LIMIT = 50;

/** Rooms I've been in, newest first, with who else played; for History and resuming. */
export async function roomHistory(me: string) {
	const db = getDb();
	const mine = await db
		.select({
			code: rooms.code,
			rows: rooms.rows,
			cols: rooms.cols,
			status: rooms.status,
			playedMs: rooms.playedMs,
			createdAt: rooms.createdAt,
			finishedAt: rooms.finishedAt,
		})
		.from(roomPlayers)
		.innerJoin(rooms, eq(rooms.code, roomPlayers.roomCode))
		.where(eq(roomPlayers.userId, me))
		.orderBy(desc(rooms.createdAt))
		.limit(HISTORY_LIMIT);
	const codes = mine.map((r) => r.code);
	const others = codes.length
		? await db
				.select({ code: roomPlayers.roomCode, name: user.name })
				.from(roomPlayers)
				.innerJoin(user, eq(user.id, roomPlayers.userId))
				.where(
					and(inArray(roomPlayers.roomCode, codes), ne(roomPlayers.userId, me)),
				)
		: [];
	return mine.map(({ rows, cols, createdAt, finishedAt, ...room }) => ({
		...room,
		pieces: rows * cols,
		createdAt: createdAt.getTime(),
		finishedAt: finishedAt?.getTime() ?? null,
		players: others.filter((o) => o.code === room.code).map((o) => o.name),
	}));
}
