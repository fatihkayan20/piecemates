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

/** What the Worker hands every call: the database, who's asking, and its room objects. */
export type Context = {
	db: Database;
	/** Null without a session; guests get an anonymous one. */
	user: { id: string; name: string } | null;
	initRoom: (room: RoomInit) => Promise<void>;
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

/** A call that needs a session. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
	return next({ ctx: { ...ctx, user: ctx.user } });
});
