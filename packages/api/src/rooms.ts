import { roomPlayers, rooms } from "@piecemates/db/schema/game";
import { isImageAspect, MAX_PLAYERS, needsName } from "@piecemates/game";
import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { myRooms } from "./my-rooms";
import {
	checkOpenRooms,
	fitsPieces,
	Grid,
	startRoom,
	underRoomCap,
} from "./new-room";
import { protectedProcedure, router } from "./trpc";
import { uploadedImage } from "./uploaded-image";

// Sample photos; uploads come in by id instead.
const ALLOWED_IMAGE_HOSTS = ["images.unsplash.com"];

const Code = z.object({ code: z.string().toUpperCase() });

/** Players meet others only under a name they picked. */
const checkName = (ctx: { user: { name: string } }) => {
	if (needsName(ctx.user.name))
		throw new TRPCError({ code: "FORBIDDEN", message: "nameNeeded" });
};

const SampleRoom = Grid.extend({
	imageUrl: z
		.url({ protocol: /^https$/ })
		.refine((u) => ALLOWED_IMAGE_HOSTS.includes(new URL(u).hostname)),
	imageW: z.int().positive(),
	imageH: z.int().positive(),
})
	.refine(fitsPieces)
	// The server can't measure a sample, so its shape is checked instead.
	.refine((r) => isImageAspect(r.imageW, r.imageH));

/** The server measures an uploaded photo itself. */
const UploadRoom = Grid.extend({ upload: z.uuid() }).refine(fitsPieces);

export const roomsRouter = router({
	/** Open: my unsolved rooms I haven't abandoned. History: solved or abandoned. Newest first. */
	list: protectedProcedure
		.input(z.object({ list: z.enum(["open", "history"]) }))
		.query(async ({ ctx, input }) => {
			const list = await myRooms(ctx.db, ctx.user.id, input.list);
			return Promise.all(
				list.map(async (room) => ({
					...room,
					imageUrl: await ctx.images.link(room.imageUrl),
				})),
			);
		}),

	/** A room from a sample photo. */
	create: protectedProcedure
		.input(SampleRoom)
		.mutation(async ({ ctx, input }) => {
			await checkOpenRooms(ctx);
			const image = {
				url: input.imageUrl,
				width: input.imageW,
				height: input.imageH,
			};
			return startRoom(ctx, image, input);
		}),

	/** A room from a photo I uploaded. */
	createFromUpload: protectedProcedure
		.input(UploadRoom)
		.mutation(async ({ ctx, input }) => {
			await checkOpenRooms(ctx);
			const image = await uploadedImage(ctx, input.upload);
			return startRoom(ctx, image, input, input.upload);
		}),

	/**
	 * Opening a room joins it; a room I abandoned becomes one of my open rooms
	 * again. Someone else's room can only be joined once it's shared, and
	 * only with a name of my own.
	 */
	open: protectedProcedure.input(Code).mutation(async ({ ctx, input }) => {
		const { code } = input;
		const { db, user } = ctx;
		const room = await db.query.rooms.findFirst({ where: { code } });
		const mine = await db.query.roomPlayers.findFirst({
			where: { roomCode: code, userId: user.id },
		});
		// A private room looks the same as a missing one.
		if (!room || (!mine && !room.shared))
			throw new TRPCError({ code: "NOT_FOUND" });
		// Joining it, or coming back to it, counts against the cap like a new room.
		if (!mine || mine.abandonedAt) {
			const playing = room.status === "playing";
			if (playing) await checkOpenRooms(ctx);
			if (!mine) checkName(ctx);
			// Checked again inside the write, so parallel joins can't all get in.
			const fits = sql`(select count(*) from ${roomPlayers} where room_code = ${code}
				and abandoned_at is null) < ${MAX_PLAYERS} and ${playing ? underRoomCap(user.id) : sql`1`}`;
			const joined = await db.run(
				sql`insert into ${roomPlayers} (room_code, user_id) select ${code}, ${user.id} where ${fits}
				on conflict (room_code, user_id) do update set abandoned_at = null where ${fits}`,
			);
			if (joined.meta.changes === 0) {
				if (playing) await checkOpenRooms(ctx);
				throw new TRPCError({ code: "FORBIDDEN", message: "roomFull" });
			}
		}
		const { seed, rows, cols, status, shared } = room;
		const imageUrl = await ctx.images.link(room.imageUrl);
		return { code, imageUrl, seed, rows, cols, status, shared };
	}),

	/** Lets others join my room by its code; I need a name of my own first. */
	share: protectedProcedure.input(Code).mutation(async ({ ctx, input }) => {
		checkName(ctx);
		const { changes } = (
			await ctx.db.run(
				sql`update ${rooms} set shared = 1 where code = ${input.code}
				and exists (select 1 from ${roomPlayers} where room_code = ${input.code}
				and user_id = ${ctx.user.id} and abandoned_at is null)`,
			)
		).meta;
		if (changes === 0) throw new TRPCError({ code: "NOT_FOUND" });
		return input;
	}),

	/** Drops the room from my open rooms; opening it again brings it back. */
	abandon: protectedProcedure.input(Code).mutation(async ({ ctx, input }) => {
		await ctx.db
			.update(roomPlayers)
			.set({ abandonedAt: new Date() })
			.where(
				and(
					eq(roomPlayers.roomCode, input.code),
					eq(roomPlayers.userId, ctx.user.id),
				),
			);
		return input;
	}),
});
