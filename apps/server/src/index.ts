import { API_PATH, handleApi } from "@piecemates/api";
import { clientIp } from "@piecemates/auth";
import { roomPlayers } from "@piecemates/db/schema/game";
import { MAX_NAME_LENGTH } from "@piecemates/game";
import { TRACE_HEADERS } from "@piecemates/telemetry";
import * as Sentry from "@sentry/cloudflare";
import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { cleanUpUploads } from "./cleanup";
import { ENV } from "./env.server";
import { STATUS } from "./http";
import { photoStorage, serveImage } from "./images";
import { Room as RoomObject } from "./room";
import { sentryFor } from "./sentry";
import { getAuth, getDb } from "./services";

export const Room = Sentry.instrumentDurableObjectWithSentry(
	sentryFor,
	RoomObject,
);

type Vars = { user: { id: string; name: string } };

const app = new Hono<{ Variables: Vars }>();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: ENV.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization", ...TRACE_HEADERS],
		credentials: true,
	}),
);

// Hono answers thrown errors itself, so Sentry has to be told about them.
app.onError((error, c) => {
	Sentry.captureException(error);
	return c.text("Internal Server Error", STATUS.internalError);
});

app.on(["POST", "GET"], "/api/auth/*", async (c) =>
	getAuth().handler(c.req.raw),
);

app.get("/", (c) => {
	return c.text("OK");
});

const sessionUser = async (headers: Headers) => {
	const session = await getAuth().api.getSession({ headers });
	// Capped here too: a name set before the cap could still be long.
	return (
		session && {
			id: session.user.id,
			name: session.user.name.slice(0, MAX_NAME_LENGTH),
		}
	);
};

app.all(`${API_PATH}/*`, async (c) =>
	handleApi(
		c.req.raw,
		{
			db: getDb(),
			user: await sessionUser(c.req.raw.headers),
			ip: clientIp(c.req.raw.headers),
			initRoom: (room) => ENV.ROOM.getByName(room.code).init(room),
			allow: async (key) => (await ENV.API_LIMIT.limit({ key })).success,
			images: photoStorage,
		},
		(error) => Sentry.captureException(error),
	),
);

app.get("/images/:id", (c) =>
	serveImage(c.req.param("id"), Number(c.req.query("w")), {
		e: c.req.query("e"),
		s: c.req.query("s"),
	}),
);

// The room socket needs a session too (guests get an anonymous one).
app.use("/rooms/*", async (c, next) => {
	const user = await sessionUser(c.req.raw.headers);
	if (!user) return c.text("Unauthorized", STATUS.unauthorized);
	c.set("user", user);
	await next();
});

app.get("/rooms/:code/ws", async (c) => {
	if (c.req.header("upgrade") !== "websocket") {
		return c.text("Expected websocket", STATUS.upgradeRequired);
	}
	// Browsers send the page's origin: another site can't open a socket as a signed-in player.
	// The native app sends none, or the server's own.
	const origin = c.req.header("origin");
	if (
		origin &&
		origin !== ENV.CORS_ORIGIN &&
		origin !== new URL(c.req.url).origin
	)
		return c.text("Forbidden", STATUS.forbidden);
	const code = c.req.param("code").toUpperCase();
	const user = c.get("user");
	// Only players who opened the room (rooms.open, which counts against their cap) get in.
	const [member] = await getDb()
		.select({ code: roomPlayers.roomCode })
		.from(roomPlayers)
		.where(
			and(
				eq(roomPlayers.roomCode, code),
				eq(roomPlayers.userId, user.id),
				isNull(roomPlayers.abandonedAt),
			),
		);
	if (!member) return c.text("Room not found", STATUS.notFound);
	// Fresh headers so clients can't spoof who they are.
	const headers = new Headers(c.req.raw.headers);
	headers.set("x-user-id", user.id);
	headers.set("x-user-name", user.name);
	return ENV.ROOM.getByName(code).fetch(
		new Request(c.req.raw.url, { headers }),
	);
});

export default Sentry.withSentry(sentryFor, {
	fetch: app.fetch,
	scheduled: (_event, _env, ctx) => ctx.waitUntil(cleanUpUploads()),
} satisfies ExportedHandler);
