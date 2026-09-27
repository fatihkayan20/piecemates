import { sampleSources, samples } from "@piecemates/db/schema/samples";
import {
	isImageAspect,
	SAMPLE_CATEGORIES,
	SAMPLES_PER_PAGE,
	type SampleCategory,
} from "@piecemates/game";
import * as Sentry from "@sentry/cloudflare";
import { count, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { ENV } from "./env.server";
import { getDb } from "./services";

const API = "https://api.unsplash.com";
/** The catalogue fills up to this many photos before the daily trickle starts. */
const MIN_SAMPLES = 200;
/** New photos each category gets a day once the catalogue is full. */
const SAMPLES_PER_DAY = 5;
/** Photos a sync marks featured in each category. */
const FEATURED_PER_CATEGORY = 2;
/** Unsplash pages one category may read per sync; the demo key allows 50 calls an hour. */
const MAX_PAGES_PER_RUN = 5;
/** Narrower photos look soft on a big puzzle. */
const MIN_SAMPLE_WIDTH = 2000;

/** Where each category's photos come from, best first. */
const SOURCES: Record<SampleCategory, string> = {
	nature: "/topics/nature/photos?order_by=popular",
	cities: "/search/photos?query=city%20skyline",
	animals: "/topics/animals/photos?order_by=popular",
	food: "/topics/food-drink/photos?order_by=popular",
	art: "/topics/textures-patterns/photos?order_by=popular",
	space: "/search/photos?query=galaxy%20night%20sky",
};

const Photo = z.object({
	id: z.string(),
	width: z.int(),
	height: z.int(),
	color: z.string(),
	urls: z.object({ raw: z.url() }),
	links: z.object({ download_location: z.url() }),
	user: z.object({ name: z.string(), links: z.object({ html: z.url() }) }),
	// Unsplash+ photos need a paid licence.
	premium: z.boolean().optional(),
	plus: z.boolean().optional(),
});
// Topics answer a list, search wraps it in `results`.
const Page = z.union([
	z.array(Photo),
	z.object({ results: z.array(Photo) }).transform((r) => r.results),
]);

/** A call to Unsplash's API with our key; throws when Unsplash says no (e.g. over the hourly limit). */
export async function unsplash(url: string) {
	const res = await fetch(url, {
		headers: {
			authorization: `Client-ID ${ENV.UNSPLASH_ACCESS_KEY}`,
			"accept-version": "v1",
		},
	});
	if (!res.ok) throw new Error(`Unsplash ${res.status} for ${url}`);
	return res.json();
}

const usable = (p: z.infer<typeof Photo>) =>
	!p.premium &&
	!p.plus &&
	p.width >= MIN_SAMPLE_WIDTH &&
	isImageAspect(p.width, p.height);

/** Adds up to `want` new photos to a category, carrying on from where its last sync stopped. */
async function fill(category: SampleCategory, want: number) {
	const db = getDb();
	const [source] = await db
		.select()
		.from(sampleSources)
		.where(eq(sampleSources.category, category));
	let page = source?.page ?? 1;
	let added = 0;
	for (let i = 0; i < MAX_PAGES_PER_RUN && added < want; i++) {
		const url = `${API}${SOURCES[category]}&orientation=landscape&per_page=${SAMPLES_PER_PAGE}&page=${page}`;
		const all = Page.parse(await unsplash(url));
		// Past the last page: start over next time, for photos that rose in the meantime.
		if (all.length === 0) {
			page = 1;
			break;
		}
		const photos = all.filter(usable);
		const known = photos.length
			? await db
					.select({ id: samples.id })
					.from(samples)
					.where(
						inArray(
							samples.id,
							photos.map((p) => p.id),
						),
					)
			: [];
		const fresh = photos.filter((p) => !known.some((k) => k.id === p.id));
		const take = fresh.slice(0, want - added);
		// One row a query: D1 binds at most 100 values per query.
		for (const p of take) {
			await db
				.insert(samples)
				.values({
					id: p.id,
					category,
					url: p.urls.raw,
					width: p.width,
					height: p.height,
					color: p.color,
					author: p.user.name,
					authorUrl: p.user.links.html,
					downloadUrl: p.links.download_location,
					featuredAt: added < FEATURED_PER_CATEGORY ? new Date() : null,
				})
				// Already in another category.
				.onConflictDoNothing();
			added++;
		}
		// A page is done once all its new photos are in; otherwise the next sync reads it again.
		if (take.length === fresh.length) page++;
	}
	await db
		.insert(sampleSources)
		.values({ category, page })
		.onConflictDoUpdate({ target: sampleSources.category, set: { page } });
	return added;
}

/**
 * Runs daily. Until the catalogue has MIN_SAMPLES photos it fills it,
 * spread over the categories; after that each category gets a few new ones.
 * A category Unsplash can't answer is left for the next day.
 */
export async function syncSamples() {
	const [row] = await getDb().select({ n: count() }).from(samples);
	const missing = MIN_SAMPLES - (row?.n ?? 0);
	const want =
		missing > 0
			? Math.ceil(missing / SAMPLE_CATEGORIES.length)
			: SAMPLES_PER_DAY;
	for (const category of SAMPLE_CATEGORIES)
		await fill(category, want).catch((error) => Sentry.captureException(error));
}
