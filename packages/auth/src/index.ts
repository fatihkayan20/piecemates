import { normalizeIP } from "@better-auth/core/utils/ip";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { expo } from "@better-auth/expo";
import type { Database } from "@piecemates/db";
import * as schema from "@piecemates/db/schema/auth";
import { rooms, uploads } from "@piecemates/db/schema/game";
import { GUEST_NAME, needsName } from "@piecemates/game";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { anonymous } from "better-auth/plugins";
import { eq, sql } from "drizzle-orm";

/** Where Cloudflare puts the caller's IP; callers can't set it themselves. */
const IP_HEADER = "cf-connecting-ip";
const HOUR_S = 3600;
/** Accounts (guest or email) one IP can make in an hour, so nobody mints endless free ones. */
const ACCOUNTS_PER_HOUR = 10;
/** Account deletions one IP can try in an hour; each one checks a password. */
const DELETES_PER_HOUR = 5;

/** The caller's IP as every limit counts it: an IPv6 /64 is one caller, since one home or phone gets a whole /64. */
export const clientIp = (headers: Headers) => {
	const ip = headers.get(IP_HEADER);
	return ip ? normalizeIP(ip) : "unknown";
};

/**
 * Checks a new or changed user: a name others can read (only a new guest
 * may be GUEST_NAME), and no image, which the apps never show.
 */
const checkUser = (
	user: { name?: unknown; image?: unknown },
	isNew: boolean,
) => {
	const { name, image } = user;
	if (image !== undefined && image !== null)
		throw new APIError("BAD_REQUEST", { message: "noImage" });
	if (name === undefined || (isNew && name === GUEST_NAME)) return;
	if (typeof name !== "string" || needsName(name))
		throw new APIError("BAD_REQUEST", { message: "badName" });
};

export type AuthConfig = {
	BETTER_AUTH_URL: string;
	BETTER_AUTH_SECRET: string;
	CORS_ORIGIN: string;
};

export function createAuth(
	env: AuthConfig,
	database: Database,
	/** Runs before an account and everything it owns (cascading in D1) is deleted. */
	beforeDeleteUser: (userId: string) => Promise<void>,
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
		// Counted in D1, since each Worker isolate has its own memory.
		rateLimit: {
			enabled: true,
			storage: "database",
			customRules: {
				"/sign-in/anonymous": { window: HOUR_S, max: ACCOUNTS_PER_HOUR },
				"/sign-up/email": { window: HOUR_S, max: ACCOUNTS_PER_HOUR },
				"/delete-user": { window: HOUR_S, max: DELETES_PER_HOUR },
			},
		},
		advanced: {
			ipAddress: { ipAddressHeaders: [IP_HEADER] },
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
		},
		user: {
			deleteUser: {
				enabled: true,
				beforeDelete: (user) => beforeDeleteUser(user.id),
			},
		},
		databaseHooks: {
			user: {
				create: { before: async (user) => checkUser(user, true) },
				update: { before: async (user) => checkUser(user, false) },
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
					// Linking mustn't hand out fresh free uploads.
					await database.run(
						sql`UPDATE user SET upload_credits = min(upload_credits, (SELECT upload_credits FROM user WHERE id = ${from})) WHERE id = ${to}`,
					);
					await database
						.update(uploads)
						.set({ userId: to })
						.where(eq(uploads.userId, from));
					await database.run(
						sql`UPDATE OR IGNORE room_players SET user_id = ${to} WHERE user_id = ${from}`,
					);
				},
			}),
		],
	});
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
