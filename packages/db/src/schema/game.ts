import { sql } from "drizzle-orm";
import {
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth";

// Live piece state lives in each room's Durable Object; D1 only indexes rooms.
export const rooms = sqliteTable(
	"rooms",
	{
		code: text("code").primaryKey(),
		ownerId: text("owner_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		imageUrl: text("image_url").notNull(),
		seed: integer("seed").notNull(),
		rows: integer("rows").notNull(),
		cols: integer("cols").notNull(),
		status: text("status", { enum: ["playing", "done"] })
			.default("playing")
			.notNull(),
		// Private until a player shares it; only then can others join by its code.
		shared: integer("shared", { mode: "boolean" }).default(false).notNull(),
		// Time spent with someone in the room; saved whenever the room empties or is solved.
		playedMs: integer("played_ms").default(0).notNull(),
		finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [index("rooms_ownerId_idx").on(table.ownerId)],
);

export const roomPlayers = sqliteTable(
	"room_players",
	{
		roomCode: text("room_code")
			.notNull()
			.references(() => rooms.code, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		joinedAt: integer("joined_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		// Set when I give up on the room; it then leaves my open rooms.
		abandonedAt: integer("abandoned_at", { mode: "timestamp_ms" }),
	},
	(table) => [
		primaryKey({ columns: [table.roomCode, table.userId] }),
		index("room_players_userId_idx").on(table.userId),
	],
);

// One row per paid upload: who owns the photo, which room uses it, and the IP cap.
export const uploads = sqliteTable(
	"uploads",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		ip: text("ip").notNull(),
		// Upload URLs signed for it; retries are capped.
		attempts: integer("attempts").default(1).notNull(),
		// Set once a room uses the photo; until then the upload can be resumed without a new credit.
		roomCode: text("room_code").references(() => rooms.code, {
			onDelete: "set null",
		}),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("uploads_userId_createdAt_idx").on(table.userId, table.createdAt),
		index("uploads_ip_createdAt_idx").on(table.ip, table.createdAt),
	],
);
