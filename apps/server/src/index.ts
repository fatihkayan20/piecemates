import { roomPlayers, rooms } from "@puzzle/db/schema/game";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { z } from "zod";

import { ENV } from "./env.server";
import { createAuth, getDb } from "./services";

export { Room } from "./room";

type Vars = { user: { id: string; name: string } };

const app = new Hono<{ Variables: Vars }>();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: ENV.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

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
	if (!session) return c.text("Unauthorized", 401);
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
const newCode = () =>
	Array.from(
		crypto.getRandomValues(new Uint8Array(6)),
		(b) => CODE_ALPHABET[b % CODE_ALPHABET.length],
	).join("");

app.post("/rooms", async (c) => {
	const body = CreateRoom.safeParse(await c.req.json().catch(() => null));
	if (!body.success || body.data.rows * body.data.cols > 1100) {
		return c.text("Invalid room", 400);
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
	// Table units: pieces are 100 wide, height follows the image's cell aspect.
	const w = 100;
	const h = (100 * (imageH / rows)) / (imageW / cols);
	await ENV.ROOM.getByName(code).init({ code, seed, rows, cols, w, h });
	return c.json({ code });
});

app.get("/rooms/:code", async (c) => {
	const code = c.req.param("code").toUpperCase();
	const db = getDb();
	const room = await db.query.rooms.findFirst({ where: { code } });
	if (!room) return c.text("Room not found", 404);
	await db
		.insert(roomPlayers)
		.values({ roomCode: code, userId: c.get("user").id })
		.onConflictDoNothing();
	const { imageUrl, seed, rows, cols, status } = room;
	return c.json({ code, imageUrl, seed, rows, cols, status });
});

app.get("/rooms/:code/ws", async (c) => {
	if (c.req.header("upgrade") !== "websocket") {
		return c.text("Expected websocket", 426);
	}
	const code = c.req.param("code").toUpperCase();
	const exists = await getDb()
		.select({ code: rooms.code })
		.from(rooms)
		.where(eq(rooms.code, code));
	if (exists.length === 0) return c.text("Room not found", 404);
	const user = c.get("user");
	// Fresh headers so clients can't spoof who they are.
	const headers = new Headers(c.req.raw.headers);
	headers.set("x-user-id", user.id);
	headers.set("x-user-name", user.name);
	return ENV.ROOM.getByName(code).fetch(
		new Request(c.req.raw.url, { headers }),
	);
});

export default app;
