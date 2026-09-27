import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Photos to start a room from, synced daily from Unsplash. Their files stay on Unsplash's CDN.
export const samples = sqliteTable(
	"samples",
	{
		// Unsplash's photo id.
		id: text("id").primaryKey(),
		// One of SAMPLE_CATEGORIES (@piecemates/game).
		category: text("category").notNull(),
		url: text("url").notNull(),
		width: integer("width").notNull(),
		height: integer("height").notNull(),
		// Shown while the photo loads.
		color: text("color").notNull(),
		author: text("author").notNull(),
		authorUrl: text("author_url").notNull(),
		// Unsplash counts a download when a room starts from the photo.
		downloadUrl: text("download_url").notNull(),
		// Set when a sync picks it for Home's featured row.
		featuredAt: integer("featured_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("samples_category_createdAt_idx").on(table.category, table.createdAt),
		index("samples_featuredAt_idx").on(table.featuredAt),
	],
);

// How far each category's sync has paged through Unsplash, so the next one starts there.
export const sampleSources = sqliteTable("sample_sources", {
	category: text("category").primaryKey(),
	page: integer("page").default(1).notNull(),
});
