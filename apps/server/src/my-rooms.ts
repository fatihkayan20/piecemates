import { user } from "@piecemates/db/schema/auth";
import { roomPlayers, rooms } from "@piecemates/db/schema/game";
import {
	and,
	count,
	eq,
	inArray,
	isNotNull,
	isNull,
	ne,
	or,
	sql,
} from "drizzle-orm";

import { getDb } from "./services";

/** Most rooms one list answer holds, newest first. */
const LIST_LIMIT = 50;

/** Continue: unsolved rooms I haven't abandoned. History: solved or abandoned. */
export type RoomList = "open" | "history";

const where = (me: string, list: RoomList) =>
	and(
		eq(roomPlayers.userId, me),
		list === "open"
			? and(isNull(roomPlayers.abandonedAt), eq(rooms.status, "playing"))
			: or(isNotNull(roomPlayers.abandonedAt), eq(rooms.status, "done")),
	);

/** How many unsolved rooms I still have open; creating a room is capped by it. */
export async function openRoomCount(me: string) {
	const [row] = await getDb()
		.select({ n: count() })
		.from(roomPlayers)
		.innerJoin(rooms, eq(rooms.code, roomPlayers.roomCode))
		.where(where(me, "open"));
	return row?.n ?? 0;
}

/** My rooms in one list, newest first, with who else played. */
export async function myRooms(me: string, list: RoomList) {
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
			abandonedAt: roomPlayers.abandonedAt,
		})
		.from(roomPlayers)
		.innerJoin(rooms, eq(rooms.code, roomPlayers.roomCode))
		.where(where(me, list))
		.orderBy(
			sql`coalesce(${roomPlayers.abandonedAt}, ${rooms.finishedAt}, ${rooms.createdAt}) desc`,
		)
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
	return mine.map(
		({ rows, cols, createdAt, finishedAt, abandonedAt, ...room }) => ({
			...room,
			pieces: rows * cols,
			createdAt: createdAt.getTime(),
			finishedAt: finishedAt?.getTime() ?? null,
			abandonedAt: abandonedAt?.getTime() ?? null,
			players: others.filter((o) => o.code === room.code).map((o) => o.name),
		}),
	);
}
