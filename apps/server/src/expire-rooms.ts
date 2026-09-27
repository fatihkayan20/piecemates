import { roomPlayers, rooms, uploads } from "@piecemates/db/schema/game";
import * as Sentry from "@sentry/cloudflare";
import { and, eq, isNull, lt, notExists, or, sql } from "drizzle-orm";

import { ENV } from "./env.server";
import { removeOriginal } from "./images";
import { getDb } from "./services";

/** A room nobody played for 30 days is cleared, even unsolved. */
const ROOM_IDLE_MS = 2_592_000_000;
/** ponytail: a cap per daily run keeps the Cron short; the rest wait a day. Raise it if a backlog builds. */
const MAX_EXPIRED_PER_RUN = 200;

/**
 * Runs daily. A room is cleared once it's solved, every player abandoned it,
 * or nobody played it for ROOM_IDLE_MS: its Durable Object storage and its
 * uploaded original go. The D1 rows stay (marked expired) for History.
 */
export async function expireRooms() {
	const db = getDb();
	const idleSince = Date.now() - ROOM_IDLE_MS;
	const stale = await db
		.select({ code: rooms.code })
		.from(rooms)
		.where(
			and(
				isNull(rooms.expiredAt),
				or(
					eq(rooms.status, "done"),
					notExists(
						db
							.select({ one: sql`1` })
							.from(roomPlayers)
							.where(
								and(
									eq(roomPlayers.roomCode, rooms.code),
									isNull(roomPlayers.abandonedAt),
								),
							),
					),
					lt(sql`coalesce(${rooms.playedAt}, ${rooms.createdAt})`, idleSince),
				),
			),
		)
		.limit(MAX_EXPIRED_PER_RUN);
	// One room failing is tried again tomorrow; the rest still go.
	for (const { code } of stale)
		await expire(code).catch((error) => Sentry.captureException(error));
}

async function expire(code: string) {
	const db = getDb();
	await ENV.ROOM.getByName(code).expire();
	const [upload] = await db
		.select({ id: uploads.id })
		.from(uploads)
		.where(eq(uploads.roomCode, code));
	if (upload) await removeOriginal(upload.id);
	await db
		.update(rooms)
		.set({ expiredAt: new Date() })
		.where(eq(rooms.code, code));
}
