import type { Database } from "@piecemates/db";
import { initTRPC, TRPCError } from "@trpc/server";

/** What the Durable Object needs to lay out a new room. */
export type RoomInit = {
	code: string;
	seed: number;
	rows: number;
	cols: number;
	w: number;
	h: number;
	rotate: boolean;
};

/** An uploaded photo's real format and size, read from the file itself. */
export type ImageInfo = { format: string; width: number; height: number };

/** What the Worker hands every call: the database, who's asking, and its room objects and photo storage. */
export type Context = {
	db: Database;
	/** Null without a session; guests get an anonymous one. */
	user: { id: string; name: string } | null;
	/** The caller's IP, for the upload cap guests can't reset by signing in again. */
	ip: string;
	initRoom: (room: RoomInit) => Promise<void>;
	/** False once this key (a user) is over its per-minute budget of writes. */
	allow: (key: string) => Promise<boolean>;
	images: {
		/** A short-lived URL that takes exactly this type and size. */
		uploadUrl: (id: string, type: string, size: number) => Promise<string>;
		/** Null when nothing was uploaded; throws when the file isn't an image. */
		info: (id: string) => Promise<ImageInfo | null>;
		/** Where the photo lives; rooms store this. */
		url: (id: string) => string;
		/** A stored photo URL signed for players to load for a while; other URLs pass through. */
		link: (url: string) => Promise<string>;
		/** Deletes the photo and its resized copies. */
		remove: (id: string) => Promise<void>;
	};
};

const t = initTRPC.context<Context>().create({
	// Our bugs go to Sentry; clients never see their details (e.g. SQL).
	errorFormatter: ({ shape, error }) =>
		error.code === "INTERNAL_SERVER_ERROR"
			? {
					...shape,
					message: "Internal server error",
					data: { ...shape.data, stack: undefined },
				}
			: shape,
});

export const router = t.router;

/** A call that needs a session; my writes are rate limited, so no loop can hammer D1, R2 or rooms. */
export const protectedProcedure = t.procedure.use(
	async ({ ctx, type, next }) => {
		if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
		if (type === "mutation" && !(await ctx.allow(ctx.user.id)))
			throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "slowDown" });
		return next({ ctx: { ...ctx, user: ctx.user } });
	},
);
