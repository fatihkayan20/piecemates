import { user as userTable } from "@piecemates/db/schema/auth";
import { uploads } from "@piecemates/db/schema/game";
import {
	imageProblem,
	MAX_UPLOAD_ATTEMPTS,
	MAX_UPLOAD_BYTES,
	MAX_UPLOADS_PER_IP,
	UPLOAD_TYPES,
	UPLOAD_WINDOW_MS,
} from "@piecemates/game";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "./trpc";
import { unusedUpload } from "./uploaded-image";

const NewUpload = z.object({
	type: z.enum(UPLOAD_TYPES),
	size: z.int().positive().max(MAX_UPLOAD_BYTES),
});

export const uploadsRouter = router({
	/**
	 * A URL that puts one photo straight into storage; it spends one of my
	 * credits. While I have an unused upload, it's retried instead (a few
	 * times at most): a new URL for the same key, which R2 fills once, so R2
	 * never holds more than one file per upload. A photo it can use there
	 * must be resumed, not replaced.
	 */
	create: protectedProcedure
		.input(NewUpload)
		.mutation(async ({ ctx, input }) => {
			const { db, user, ip } = ctx;
			const unused = await unusedUpload(ctx);
			if (unused) {
				const info = await ctx.images
					.info(unused.id)
					.catch(() => "invalid" as const);
				if (info && info !== "invalid" && !imageProblem(info))
					throw new TRPCError({ code: "BAD_REQUEST", message: "useUploaded" });
				const retried = await db.run(
					sql`update ${uploads} set attempts = attempts + 1
						where id = ${unused.id} and attempts < ${MAX_UPLOAD_ATTEMPTS}`,
				);
				if (retried.meta.changes === 0)
					throw new TRPCError({
						code: "TOO_MANY_REQUESTS",
						message: "tooManyRetries",
					});
				if (info) await ctx.images.remove(unused.id);
				const url = await ctx.images.uploadUrl(
					unused.id,
					input.type,
					input.size,
				);
				return { id: unused.id, url };
			}
			const id = crypto.randomUUID();
			const since = Date.now() - UPLOAD_WINDOW_MS;
			// All or nothing: the row is only added with a credit left and under the IP cap, and only then is a credit spent.
			const [added] = await db.batch([
				db.run(
					sql`insert into ${uploads} (id, user_id, ip) select ${id}, ${user.id}, ${ip}
						where (select upload_credits from ${userTable} where id = ${user.id}) > 0
						and (select count(*) from ${uploads} where ip = ${ip} and created_at > ${since}) < ${MAX_UPLOADS_PER_IP}`,
				),
				db.run(
					sql`update ${userTable} set upload_credits = upload_credits - 1
						where id = ${user.id} and exists (select 1 from ${uploads} where id = ${id})`,
				),
			]);
			if (added.meta.changes === 0) {
				const me = await db.query.user.findFirst({ where: { id: user.id } });
				throw me?.uploadCredits
					? new TRPCError({
							code: "TOO_MANY_REQUESTS",
							message: "tooManyUploads",
						})
					: new TRPCError({ code: "FORBIDDEN", message: "noUploadCredits" });
			}
			return {
				id,
				url: await ctx.images.uploadUrl(id, input.type, input.size),
			};
		}),

	/** How many photos I can still upload. */
	credits: protectedProcedure.query(async ({ ctx }) => {
		const me = await ctx.db.query.user.findFirst({
			where: { id: ctx.user.id },
			columns: { uploadCredits: true },
		});
		return me?.uploadCredits ?? 0;
	}),

	/** My uploaded photo that no room uses yet, to resume without a new credit. */
	unused: protectedProcedure.query(async ({ ctx }) => {
		const unused = await unusedUpload(ctx);
		const info = unused && (await ctx.images.info(unused.id).catch(() => null));
		if (!unused || !info || imageProblem(info)) return null;
		const { width, height } = info;
		return { id: unused.id, url: ctx.images.url(unused.id), width, height };
	}),
});
