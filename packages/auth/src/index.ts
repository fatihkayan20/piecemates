import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { expo } from "@better-auth/expo";
import type { Database } from "@piecemates/db";
import * as schema from "@piecemates/db/schema/auth";
import { rooms } from "@piecemates/db/schema/game";
import { betterAuth } from "better-auth";
import { anonymous } from "better-auth/plugins";
import { eq, sql } from "drizzle-orm";

export type AuthConfig = {
	BETTER_AUTH_URL: string;
	BETTER_AUTH_SECRET: string;
	CORS_ORIGIN: string;
};

export function createAuth(
	env: AuthConfig,
	database: Database,
	desktopOrigins: readonly string[] = [],
) {
	return betterAuth({
		database: drizzleAdapter(database, {
			provider: "sqlite",
			schema,
		}),
		trustedOrigins: [
			env.CORS_ORIGIN,
			...desktopOrigins,
			"piecemates://",
			"exp://",
			"http://localhost:8081",
		],
		emailAndPassword: { enabled: true },
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
		},
		plugins: [
			expo(),
			anonymous({
				// Runs before the guest user is deleted (which would cascade their rooms away).
				onLinkAccount: async ({ anonymousUser, newUser }) => {
					const from = anonymousUser.user.id;
					const to = newUser.user.id;
					await database
						.update(rooms)
						.set({ ownerId: to })
						.where(eq(rooms.ownerId, from));
					await database.run(
						sql`UPDATE OR IGNORE room_players SET user_id = ${to} WHERE user_id = ${from}`,
					);
				},
			}),
		],
	});
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
