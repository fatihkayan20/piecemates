import { user } from "@piecemates/db/schema/auth";
import { roomPlayers, rooms } from "@piecemates/db/schema/game";
import { and, count, desc, eq, inArray, isNull, ne } from "drizzle-orm";

import { getDb } from "./services";

/** Most rooms one list answer holds, newest first. */
const LIST_LIMIT = 50;

export type RoomStatus = (typeof rooms.status.enumValues)[number];

/** My rooms I haven't abandoned, with this status. */
const mineWith = (me: string, status: RoomStatus) =>
	and(
		eq(roomPlayers.userId, me),
		isNull(roomPlayers.abandonedAt),
		eq(rooms.status, status),
	);

/** How many unsolved rooms I still have open; creating a room is capped by it. */
export async function openRoomCount(me: string) {
	const [row] = await getDb()
		.select({ n: count() })
		.from(roomPlayers)
		.innerJoin(rooms, eq(rooms.code, roomPlayers.roomCode))
		.where(mineWith(me, "playing"));
	return row?.n ?? 0;
}

/** My open (Continue) or solved (History) rooms, newest first, with who else played. */
export async function myRooms(me: string, status: RoomStatus) {
	const db = getDb();
	const mine = await db
		.select({
			code: rooms.code,
			imageUrl: rooms.imageUrl,
			rows: rooms.rows,
			cols: rooms.cols,
			status: rooms.status,
			playedMs: rooms.playedMs,
			createdAt: rooms.createdAt,
			finishedAt: rooms.finishedAt,
		})
		.from(roomPlayers)
		.innerJoin(rooms, eq(rooms.code, roomPlayers.roomCode))
		.where(mineWith(me, status))
		.orderBy(desc(rooms.finishedAt), desc(rooms.createdAt))
		.limit(LIST_LIMIT);
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
