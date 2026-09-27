import { roomPlayers, rooms } from "@piecemates/db/schema/game";
import { CELL_WIDTH, MAX_OPEN_ROOMS, MAX_PIECES } from "@piecemates/game";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { myRooms, openRoomCount } from "./my-rooms";
import { newCode } from "./room-code";
import { protectedProcedure, router } from "./trpc";

// ponytail: only Unsplash for now; add the R2 public host with uploads.
const ALLOWED_IMAGE_HOSTS = ["images.unsplash.com"];
const MIN_SIDE = 2;
const MAX_SIDE = 60;

const side = z.int().min(MIN_SIDE).max(MAX_SIDE);
const Code = z.object({ code: z.string().toUpperCase() });

const NewRoom = z
	.object({
		imageUrl: z
			.url({ protocol: /^https$/ })
			.refine((u) => ALLOWED_IMAGE_HOSTS.includes(new URL(u).hostname)),
		imageW: z.int().positive(),
		imageH: z.int().positive(),
		rows: side,
		cols: side,
		/** Pieces start turned and players turn them. */
		rotate: z.boolean().default(false),
	})
	.refine((r) => r.rows * r.cols <= MAX_PIECES);

const tooMany = () =>
	new TRPCError({ code: "CONFLICT", message: "Too many open rooms" });

export const roomsRouter = router({
	/** Open: my unsolved rooms I haven't abandoned. History: solved or abandoned. Newest first. */
	list: protectedProcedure
		.input(z.object({ list: z.enum(["open", "history"]) }))
		.query(({ ctx, input }) => myRooms(ctx.db, ctx.user.id, input.list)),

	create: protectedProcedure.input(NewRoom).mutation(async ({ ctx, input }) => {
		const { imageUrl, imageW, imageH, rows, cols, rotate } = input;
		const { db, user } = ctx;
		if ((await openRoomCount(db, user.id)) >= MAX_OPEN_ROOMS) throw tooMany();
		const code = newCode();
		const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
		await db.batch([
			db
				.insert(rooms)
				.values({ code, ownerId: user.id, imageUrl, seed, rows, cols }),
			db.insert(roomPlayers).values({ roomCode: code, userId: user.id }),
		]);
		// Table units: height follows the image's cell aspect.
		const w = CELL_WIDTH;
		const h = (CELL_WIDTH * (imageH / rows)) / (imageW / cols);
		await ctx.initRoom({ code, seed, rows, cols, w, h, rotate });
		return { code };
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
		if (
			mine?.abandonedAt &&
			room.status === "playing" &&
			(await openRoomCount(db, user.id)) >= MAX_OPEN_ROOMS
		)
			throw tooMany();
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
