import { roomPlayers } from "@piecemates/db/schema/game";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { myRooms } from "./my-rooms";
import { checkOpenRooms, fitsPieces, Grid, startRoom } from "./new-room";
import { protectedProcedure, router } from "./trpc";
import { uploadedImage } from "./uploaded-image";

// Sample photos; uploads come in by id instead.
const ALLOWED_IMAGE_HOSTS = ["images.unsplash.com"];

const Code = z.object({ code: z.string().toUpperCase() });

const SampleRoom = Grid.extend({
	imageUrl: z
		.url({ protocol: /^https$/ })
		.refine((u) => ALLOWED_IMAGE_HOSTS.includes(new URL(u).hostname)),
	imageW: z.int().positive(),
	imageH: z.int().positive(),
}).refine(fitsPieces);

/** The server measures an uploaded photo itself. */
const UploadRoom = Grid.extend({ upload: z.uuid() }).refine(fitsPieces);

export const roomsRouter = router({
	/** Open: my unsolved rooms I haven't abandoned. History: solved or abandoned. Newest first. */
	list: protectedProcedure
		.input(z.object({ list: z.enum(["open", "history"]) }))
		.query(({ ctx, input }) => myRooms(ctx.db, ctx.user.id, input.list)),

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

	/** Opening a room joins it; a room I abandoned becomes one of my open rooms again. */
	open: protectedProcedure.input(Code).mutation(async ({ ctx, input }) => {
		const { code } = input;
		const { db, user } = ctx;
		const room = await db.query.rooms.findFirst({ where: { code } });
		if (!room) throw new TRPCError({ code: "NOT_FOUND" });
		const mine = await db.query.roomPlayers.findFirst({
			where: { roomCode: code, userId: user.id },
		});
		// It counts against the cap like a new room.
		if (mine?.abandonedAt && room.status === "playing")
			await checkOpenRooms(ctx);
		await db
			.insert(roomPlayers)
			.values({ roomCode: code, userId: user.id })
			.onConflictDoUpdate({
				target: [roomPlayers.roomCode, roomPlayers.userId],
				set: { abandonedAt: null },
			});
		const { imageUrl, seed, rows, cols, status } = room;
		return { code, imageUrl, seed, rows, cols, status };
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
