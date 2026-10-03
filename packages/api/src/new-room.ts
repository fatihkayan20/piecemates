import { roomPlayers, rooms, uploads } from "@piecemates/db/schema/game";
import {
	CELL_WIDTH,
	MAX_OPEN_ROOMS,
	MAX_PIECES,
	MAX_TABLE_ASPECT,
} from "@piecemates/game";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { z } from "zod";

import { openRoomCount } from "./my-rooms";
import { newCode } from "./room-code";
import type { Context } from "./trpc";

const MIN_SIDE = 2;
const MAX_SIDE = 60;
const side = z.int().min(MIN_SIDE).max(MAX_SIDE);

/** How the photo is cut. */
export const Grid = z.object({
	rows: side,
	cols: side,
	/** Pieces start turned and players turn them. */
	rotate: z.boolean().default(false),
	/** Width / height of my screen, so the pile suits it. */
	aspect: z
		.number()
		.positive()
		.transform((a) =>
			Math.min(MAX_TABLE_ASPECT, Math.max(1 / MAX_TABLE_ASPECT, a)),
		)
		.optional(),
});
export const fitsPieces = (g: { rows: number; cols: number }) =>
	g.rows * g.cols <= MAX_PIECES;

type Me = Context & { user: { id: string } };

export const tooMany = () =>
	new TRPCError({ code: "CONFLICT", message: "Too many open rooms" });

/**
 * SQL for "I have fewer than MAX_OPEN_ROOMS open rooms" (counted as Continue
 * lists them, so a cleared room doesn't count), for the WHERE of the
 * insert that adds one: a separate check first would let parallel requests
 * all pass it.
 */
export const underRoomCap = (userId: string) =>
	sql`(select count(*) from ${roomPlayers} rp join ${rooms} r on r.code = rp.room_code
		where rp.user_id = ${userId} and rp.abandoned_at is null and r.status = 'playing'
		and r.expired_at is null) < ${MAX_OPEN_ROOMS}`;

/** Throws when I already have the most open rooms (an early answer; the insert checks again). */
export async function checkOpenRooms(ctx: Me) {
	if ((await openRoomCount(ctx.db, ctx.user.id)) >= MAX_OPEN_ROOMS)
		throw tooMany();
}

/**
 * Makes the room, joins me to it and lays out its pieces. With `upload`, the
 * room takes that unused upload in the same all-or-nothing batch, so one
 * upload can't make two rooms. With `sample`, the room keeps which catalogue
 * photo it shows, for its credit.
 */
export async function startRoom(
	ctx: Me,
	image: { url: string; width: number; height: number },
	grid: z.infer<typeof Grid>,
	{ upload, sample }: { upload?: string; sample?: string },
) {
	const { db, user } = ctx;
	const { rows, cols, rotate, aspect } = grid;
	const code = newCode();
	const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
	const unused = upload
		? sql`exists (select 1 from ${uploads} where id = ${upload} and user_id = ${user.id} and room_code is null)`
		: sql`1`;
	const made = sql`exists (select 1 from ${rooms} where code = ${code})`;
	const [room] = await db.batch([
		db.run(
			sql`insert into ${rooms} (code, owner_id, image_url, sample_id, seed, rows, cols)
				select ${code}, ${user.id}, ${image.url}, ${sample ?? null}, ${seed}, ${rows}, ${cols}
				where ${unused} and ${underRoomCap(user.id)}`,
		),
		db.run(
			sql`insert into ${roomPlayers} (room_code, user_id) select ${code}, ${user.id} where ${made}`,
		),
		db.run(
			sql`update ${uploads} set room_code = ${code} where id = ${upload ?? null} and room_code is null and ${made}`,
		),
	]);
	if (room.meta.changes === 0) {
		await checkOpenRooms(ctx);
		throw new TRPCError({ code: "NOT_FOUND" });
	}
	// Table units: height follows the image's cell aspect.
	const w = CELL_WIDTH;
	const h = (CELL_WIDTH * (image.height / rows)) / (image.width / cols);
	await ctx.initRoom({ code, seed, rows, cols, w, h, rotate, aspect });
	return { code };
}
