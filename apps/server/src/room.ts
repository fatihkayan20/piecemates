/// <reference path="../cloudflare-env.d.ts" />
import { DurableObject } from "cloudflare:workers";
import { createDb } from "@piecemates/db";
import { rooms } from "@piecemates/db/schema/game";
import {
	apply,
	ClientMsg,
	createState,
	isComplete,
	MAX_PLAYERS,
	type Player,
	pause,
	resume,
	type ServerMsg,
	type State,
} from "@piecemates/game";
import { eq } from "drizzle-orm";

/** The player a socket belongs to, stored on it when it connected. */
const playerOf = (ws: WebSocket): Player => ws.deserializeAttachment();

/**
 * One instance per room code. Holds the sockets (hibernatable, so an idle room
 * costs nothing) and the authoritative piece state.
 */
export class Room extends DurableObject<Env> {
	private code = "";
	private state: State | undefined;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		ctx.blockConcurrencyWhile(async () => {
			this.code = (await ctx.storage.get<string>("code")) ?? "";
			this.state = await ctx.storage.get<State>("state");
			// Rooms made before the clock and rotation existed.
			if (this.state) {
				this.state.clock ??= { played: 0, since: null };
				this.state.rotate ??= false;
				for (const p of this.state.pieces) p.rot ??= 0;
			}
		});
	}

	async init(opts: {
		code: string;
		seed: number;
		rows: number;
		cols: number;
		w: number;
		h: number;
		rotate: boolean;
	}) {
		if (this.state) return;
		const { code, ...rest } = opts;
		this.code = code;
		this.state = createState(rest);
		// ponytail: whole state under one key (~60 KB at 1000 pieces); split per piece if it grows.
		await this.ctx.storage.put({ code, state: this.state });
	}

	override async fetch(req: Request) {
		const userId = req.headers.get("x-user-id");
		const name = req.headers.get("x-user-name") ?? "Guest";
		if (!this.state || !userId)
			return new Response("Room not found", { status: 404 });

		const players = this.players();
		if (
			!players.some((p) => p.id === userId) &&
			players.length >= MAX_PLAYERS
		) {
			return new Response("Room is full", { status: 403 });
		}

		if (players.length === 0) {
			resume(this.state, Date.now());
			await this.ctx.storage.put("state", this.state);
		}

		const { 0: client, 1: server } = new WebSocketPair();
		this.ctx.acceptWebSocket(server);
		server.serializeAttachment({ id: userId, name } satisfies Player);
		this.send(server, { type: "state", state: this.state, you: userId });
		this.broadcast({ type: "presence", players: this.players() });
		return new Response(null, { status: 101, webSocket: client });
	}

	override async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer) {
		if (!this.state || typeof data !== "string") return;
		let parsed: ReturnType<typeof ClientMsg.safeParse>;
		try {
			parsed = ClientMsg.safeParse(JSON.parse(data));
		} catch {
			return;
		}
		if (!parsed.success) return;
		const msg = parsed.data;
		const by = playerOf(ws).id;

		if (!apply(this.state, by, msg)) {
			this.send(ws, { type: "rejected", msg });
			return;
		}
		await this.ctx.storage.put("state", this.state);
		this.broadcast({ type: "applied", by, msg });

		if (msg.type === "drop" && isComplete(this.state)) await this.stopClock();
	}

	override async webSocketClose(ws: WebSocket) {
		const by = playerOf(ws).id;
		ws.close();
		// Same user may still be connected from another tab/device.
		const players = this.players();
		const stillHere = players.some((p) => p.id === by);
		if (this.state && !stillHere) {
			apply(this.state, by, { type: "leave" });
			await this.ctx.storage.put("state", this.state);
			this.broadcast({ type: "applied", by, msg: { type: "leave" } });
		}
		this.broadcast({ type: "presence", players });
		if (players.length === 0) await this.stopClock();
	}

	/**
	 * Pauses the clock when the room empties or is solved, and saves the time
	 * for history. A socket lost without a close event keeps it running.
	 */
	private async stopClock() {
		if (!this.state || this.state.clock.since === null) return;
		const now = Date.now();
		pause(this.state, now);
		await this.ctx.storage.put("state", this.state);
		this.broadcast({ type: "clock", clock: this.state.clock });
		const done = isComplete(this.state);
		await createDb(this.env)
			.update(rooms)
			.set({
				playedMs: this.state.clock.played,
				...(done && { status: "done", finishedAt: new Date(now) }),
			})
			.where(eq(rooms.code, this.code));
	}

	private players(): Player[] {
		const byId = new Map<string, Player>();
		for (const ws of this.ctx.getWebSockets()) {
			if (ws.readyState !== WebSocket.OPEN) continue;
			const p = playerOf(ws);
			byId.set(p.id, p);
		}
		return [...byId.values()];
	}

	private send(ws: WebSocket, msg: ServerMsg) {
		ws.send(JSON.stringify(msg));
	}

	private broadcast(msg: ServerMsg) {
		const data = JSON.stringify(msg);
		for (const ws of this.ctx.getWebSockets()) {
			if (ws.readyState === WebSocket.OPEN) ws.send(data);
		}
	}
}
