import { roomPlayers, rooms } from "@piecemates/db/schema/game";
import { CELL_WIDTH, MAX_PIECES } from "@piecemates/game";
import { TRACE_HEADERS } from "@piecemates/telemetry";
import * as Sentry from "@sentry/cloudflare";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { z } from "zod";

import { ENV } from "./env.server";
import { STATUS } from "./http";
import { Room as RoomObject } from "./room";
import { sentryFor } from "./sentry";
import { createAuth, getDb } from "./services";

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
	(await createAuth()).handler(c.req.raw),
);

app.get("/", (c) => {
	return c.text("OK");
});

// Everything under /rooms needs a session (guests get an anonymous one).
app.use("/rooms/*", async (c, next) => {
	const auth = await createAuth();
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.text("Unauthorized", STATUS.unauthorized);
	c.set("user", { id: session.user.id, name: session.user.name });
	await next();
});

// ponytail: only Unsplash for now; add the R2 public host with uploads.
const ALLOWED_IMAGE_HOSTS = ["images.unsplash.com"];

const CreateRoom = z.object({
	imageUrl: z
		.url({ protocol: /^https$/ })
		.refine((u) => ALLOWED_IMAGE_HOSTS.includes(new URL(u).hostname)),
	imageW: z.int().positive(),
	imageH: z.int().positive(),
	rows: z.int().min(2).max(60),
	cols: z.int().min(2).max(60),
});

// No 0/O/1/I/L so codes are easy to read out loud.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
// 31^8 ≈ 850 billion codes, too many to guess one; still short to type.
const CODE_LENGTH = 8;
const BYTE_VALUES = 256;
// Bytes at or above this are skipped so every letter is equally likely.
const BYTE_LIMIT = BYTE_VALUES - (BYTE_VALUES % CODE_ALPHABET.length);
function newCode() {
	let code = "";
	while (code.length < CODE_LENGTH)
		for (const b of crypto.getRandomValues(new Uint8Array(CODE_LENGTH)))
			if (b < BYTE_LIMIT && code.length < CODE_LENGTH)
				code += CODE_ALPHABET[b % CODE_ALPHABET.length];
	return code;
}

app.post("/rooms", async (c) => {
	const body = CreateRoom.safeParse(await c.req.json().catch(() => null));
	if (!body.success || body.data.rows * body.data.cols > MAX_PIECES) {
		return c.text("Invalid room", STATUS.badRequest);
	}
	const { imageUrl, imageW, imageH, rows, cols } = body.data;
	const user = c.get("user");
	const code = newCode();
	const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
	const db = getDb();
	await db.batch([
		db
			.insert(rooms)
			.values({ code, ownerId: user.id, imageUrl, seed, rows, cols }),
		db.insert(roomPlayers).values({ roomCode: code, userId: user.id }),
	]);
	// Table units: height follows the image's cell aspect.
	const w = CELL_WIDTH;
	const h = (CELL_WIDTH * (imageH / rows)) / (imageW / cols);
	await ENV.ROOM.getByName(code).init({ code, seed, rows, cols, w, h });
	return c.json({ code });
});

app.get("/rooms/:code", async (c) => {
	const code = c.req.param("code").toUpperCase();
	const db = getDb();
	const room = await db.query.rooms.findFirst({ where: { code } });
	if (!room) return c.text("Room not found", STATUS.notFound);
	await db
		.insert(roomPlayers)
		.values({ roomCode: code, userId: c.get("user").id })
		.onConflictDoNothing();
	const { imageUrl, seed, rows, cols, status } = room;
	return c.json({ code, imageUrl, seed, rows, cols, status });
});

app.get("/rooms/:code/ws", async (c) => {
	if (c.req.header("upgrade") !== "websocket") {
		return c.text("Expected websocket", STATUS.upgradeRequired);
	}
	const code = c.req.param("code").toUpperCase();
	const exists = await getDb()
		.select({ code: rooms.code })
		.from(rooms)
		.where(eq(rooms.code, code));
	if (exists.length === 0) return c.text("Room not found", STATUS.notFound);
	const user = c.get("user");
	// Fresh headers so clients can't spoof who they are.
	const headers = new Headers(c.req.raw.headers);
	headers.set("x-user-id", user.id);
	headers.set("x-user-name", user.name);
	return ENV.ROOM.getByName(code).fetch(
		new Request(c.req.raw.url, { headers }),
	);
});

export default Sentry.withSentry(sentryFor, app);
