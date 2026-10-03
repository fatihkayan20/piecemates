import { roomPlayers, rooms, uploads } from "@piecemates/db/schema/game";
import { and, asc, eq, ne } from "drizzle-orm";

import { ENV } from "./env.server";
import { getDb } from "./services";

/**
 * Before an account is deleted (its rooms, memberships and uploads cascade
 * away in D1): a room I own that others played passes to the first of them,
 * with its photo, so it stays in their History; a room only I played is
 * cleared like the daily cleanup does. First my sockets close everywhere.
 * My uploaded originals go with the daily stray-file cleanup.
 */
export async function beforeDeleteUser(userId: string) {
	const db = getDb();
	const joined = await db
		.select({ code: roomPlayers.roomCode })
		.from(roomPlayers)
		.where(eq(roomPlayers.userId, userId));
	for (const { code } of joined) await ENV.ROOM.getByName(code).leave(userId);
	const owned = await db
		.select({ code: rooms.code })
		.from(rooms)
		.where(eq(rooms.ownerId, userId));
	for (const { code } of owned) {
		const [heir] = await db
			.select({ id: roomPlayers.userId })
			.from(roomPlayers)
			.where(
				and(eq(roomPlayers.roomCode, code), ne(roomPlayers.userId, userId)),
			)
			.orderBy(asc(roomPlayers.joinedAt))
			.limit(1);
		if (!heir) {
			await ENV.ROOM.getByName(code).expire();
			continue;
		}
		await db
			.update(rooms)
			.set({ ownerId: heir.id })
			.where(eq(rooms.code, code));
		await db
			.update(uploads)
			.set({ userId: heir.id })
			.where(eq(uploads.roomCode, code));
	}
}
