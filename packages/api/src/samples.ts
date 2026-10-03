import { samples } from "@piecemates/db/schema/samples";
import {
	FEATURED_SAMPLES,
	SAMPLE_CATEGORIES,
	SAMPLES_PER_PAGE,
	UNSPLASH_REFERRAL,
} from "@piecemates/game";
import { TRPCError } from "@trpc/server";
import { desc, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";

import { type Context, protectedProcedure, router } from "./trpc";

const MAX_PAGE = 100;

const shown = {
	id: samples.id,
	url: samples.url,
	width: samples.width,
	height: samples.height,
	color: samples.color,
	author: samples.author,
	authorUrl: samples.authorUrl,
};
/** The photographer's link carries the referral Unsplash asks for on every link back. */
const referred = (authorUrl: string) => `${authorUrl}?${UNSPLASH_REFERRAL}`;
const credited = <T extends { authorUrl: string }>(rows: T[]) =>
	rows.map((r) => ({ ...r, authorUrl: referred(r.authorUrl) }));

/** "Photo by … on Unsplash" for a room cut from a sample; null for an upload. */
export const creditOf = (author: string | null, authorUrl: string | null) =>
	author && authorUrl ? { author, authorUrl: referred(authorUrl) } : null;

/** A sample to start a room from; an unknown one is NOT_FOUND. */
export async function sampleImage(ctx: Context, id: string) {
	const sample = await ctx.db.query.samples.findFirst({ where: { id } });
	if (!sample) throw new TRPCError({ code: "NOT_FOUND" });
	return sample;
}

export const samplesRouter = router({
	/** Home's featured row: the photos the latest syncs picked. */
	featured: protectedProcedure.query(async ({ ctx }) =>
		credited(
			await ctx.db
				.select(shown)
				.from(samples)
				.where(isNotNull(samples.featuredAt))
				.orderBy(desc(samples.featuredAt), samples.id)
				.limit(FEATURED_SAMPLES),
		),
	),

	/** A category's photos, newest first, a page at a time. */
	list: protectedProcedure
		.input(
			z.object({
				category: z.enum(SAMPLE_CATEGORIES),
				page: z.int().min(0).max(MAX_PAGE).default(0),
			}),
		)
		.query(async ({ ctx, input }) =>
			credited(
				await ctx.db
					.select(shown)
					.from(samples)
					.where(eq(samples.category, input.category))
					.orderBy(desc(samples.createdAt), samples.id)
					.limit(SAMPLES_PER_PAGE)
					.offset(input.page * SAMPLES_PER_PAGE),
			),
		),
});
