import type { Database } from "@piecemates/db";
import { user } from "@piecemates/db/schema/auth";
import { roomPlayers, rooms } from "@piecemates/db/schema/game";
import { samples } from "@piecemates/db/schema/samples";
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

import { creditOf } from "./samples";

/** Most rooms one list answer holds, newest first. */
const LIST_LIMIT = 50;

/** Continue: unsolved rooms I haven't abandoned. History: solved, abandoned or cleared. */
export type RoomList = "open" | "history";

const where = (me: string, list: RoomList) =>
	and(
		eq(roomPlayers.userId, me),
		list === "open"
			? and(
					isNull(roomPlayers.abandonedAt),
					eq(rooms.status, "playing"),
					isNull(rooms.expiredAt),
				)
			: or(
					isNotNull(roomPlayers.abandonedAt),
					eq(rooms.status, "done"),
					isNotNull(rooms.expiredAt),
				),
	);

/** How many unsolved rooms I still have open; creating a room is capped by it. */
export async function openRoomCount(db: Database, me: string) {
	const [row] = await db
		.select({ n: count() })
		.from(roomPlayers)
		.innerJoin(rooms, eq(rooms.code, roomPlayers.roomCode))
		.where(where(me, "open"));
	return row?.n ?? 0;
}

/** My rooms in one list, newest first, with who else played. */
export async function myRooms(db: Database, me: string, list: RoomList) {
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
			expiredAt: rooms.expiredAt,
			abandonedAt: roomPlayers.abandonedAt,
			author: samples.author,
			authorUrl: samples.authorUrl,
		})
		.from(roomPlayers)
		.innerJoin(rooms, eq(rooms.code, roomPlayers.roomCode))
		.leftJoin(samples, eq(samples.id, rooms.sampleId))
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
		({
			rows,
			cols,
			createdAt,
			finishedAt,
			expiredAt,
			abandonedAt,
			author,
			authorUrl,
			...room
		}) => ({
			...room,
			credit: creditOf(author, authorUrl),
			expired: expiredAt !== null,
			pieces: rows * cols,
			createdAt: createdAt.getTime(),
			finishedAt: finishedAt?.getTime() ?? null,
			abandonedAt: abandonedAt?.getTime() ?? null,
			players: others.filter((o) => o.code === room.code).map((o) => o.name),
		}),
	);
}
