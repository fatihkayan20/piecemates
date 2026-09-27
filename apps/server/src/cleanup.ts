import { user } from "@piecemates/db/schema/auth";
import { uploads } from "@piecemates/db/schema/game";
import { UPLOAD_WINDOW_MS } from "@piecemates/game";
import { and, eq, inArray, isNull, lt, sql } from "drizzle-orm";

import { ENV } from "./env.server";
import { photoStorage } from "./images";
import { getDb } from "./services";

const ORIGINALS = "uploads/";
/** D1 takes at most 100 bound values per query. */
const IDS_PER_QUERY = 100;

/**
 * Runs daily. An upload no room used within the upload window goes with its
 * files, and its credit comes back (its IP cap day is over too). Files no
 * upload owns go as well: nothing should leave one, this catches any that do.
 */
export async function cleanUpUploads() {
	const db = getDb();
	const since = Date.now() - UPLOAD_WINDOW_MS;
	const stale = await db
		.delete(uploads)
		.where(
			and(isNull(uploads.roomCode), lt(uploads.createdAt, new Date(since))),
		)
		.returning({ id: uploads.id, userId: uploads.userId });
	for (const upload of stale) {
		await db
			.update(user)
			.set({ uploadCredits: sql`${user.uploadCredits} + 1` })
			.where(eq(user.id, upload.userId));
		await photoStorage.remove(upload.id);
	}
	let cursor: string | undefined;
	do {
		const page = await ENV.IMAGES_BUCKET.list({ prefix: ORIGINALS, cursor });
		// A newer file may still be on its way to its upload row.
		const ids = page.objects
			.filter((o) => o.uploaded.getTime() < since)
			.map((o) => o.key.slice(ORIGINALS.length));
		for (let i = 0; i < ids.length; i += IDS_PER_QUERY) {
			const chunk = ids.slice(i, i + IDS_PER_QUERY);
			const owned = await db
				.select({ id: uploads.id })
				.from(uploads)
				.where(inArray(uploads.id, chunk));
			for (const id of chunk)
				if (!owned.some((o) => o.id === id)) await photoStorage.remove(id);
		}
		cursor = page.truncated ? page.cursor : undefined;
	} while (cursor);
}
