/// <reference path="../cloudflare-env.d.ts" />
import { DurableObject } from "cloudflare:workers";
import {
	apply,
	CLOSE_POLICY,
	createState,
	isComplete,
	MAX_PLAYERS,
	pause,
	resume,
	type ServerMsg,
	type State,
} from "@piecemates/game";

import {
	attach,
	broadcast,
	makeRoomFor,
	messageRate,
	parseMsg,
	playerOf,
	playersOf,
	readName,
	saveTime,
	socketsOf,
	upgrade,
} from "./room-sockets";

/**
 * One instance per room code. Holds the sockets (hibernatable, so an idle room
 * costs nothing) and the authoritative piece state.
 */
export class Room extends DurableObject<Env> {
	private code = "";
	private state: State | undefined;
	private tooFast = messageRate();

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		ctx.blockConcurrencyWhile(async () => {
			this.code = (await ctx.storage.get<string>("code")) ?? "";
			this.state = upgrade(await ctx.storage.get<State>("state"));
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
		aspect?: number;
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
		const name = decodeURIComponent(req.headers.get("x-user-name") ?? "");
		if (!this.state || !userId)
			return new Response("Room not found", { status: 404 });

		const players = this.players();
		if (
			!players.some((p) => p.id === userId) &&
			players.length >= MAX_PLAYERS
		) {
			return new Response("Room is full", { status: 403 });
		}

		makeRoomFor(this.ctx.getWebSockets(), userId);

		if (players.length === 0) {
			resume(this.state, Date.now());
			await this.ctx.storage.put("state", this.state);
		}

		const { 0: client, 1: server } = new WebSocketPair();
		this.ctx.acceptWebSocket(server);
		attach(server, userId, name);
		this.send(server, { type: "state", state: this.state, you: userId });
		this.broadcast({ type: "presence", players: this.players() });
		return new Response(null, { status: 101, webSocket: client });
	}

	override async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer) {
		const msg = parseMsg(data);
		if (!this.state || !msg) return;
		if (msg === "rename") {
			if (!this.tooFast(ws)) await this.rename(playerOf(ws).id);
			return;
		}
		const by = playerOf(ws).id;

		// Too fast is rejected like a bad move, so the client puts the piece back.
		if (this.tooFast(ws) || !apply(this.state, by, msg)) {
			this.send(ws, { type: "rejected", msg });
			return;
		}
		await this.ctx.storage.put("state", this.state);
		this.broadcast({ type: "applied", by, msg });

		if (msg.type === "drop" && isComplete(this.state)) await this.stopClock();
	}

	override async webSocketClose(ws: WebSocket) {
		ws.close();
		await this.dropped(playerOf(ws).id);
	}

	/** Closes a player's sockets, e.g. after they abandon the room. */
	async leave(userId: string) {
		for (const ws of socketsOf(this.ctx.getWebSockets(), userId))
			ws.close(CLOSE_POLICY, "Left the room");
		await this.dropped(userId);
	}

	/** Deletes the live room for good (the daily cleanup); D1 keeps its row for History. */
	async expire() {
		this.state = undefined;
		for (const ws of this.ctx.getWebSockets())
			ws.close(CLOSE_POLICY, "Room cleared");
		await this.ctx.storage.deleteAll();
	}

	/** After a socket closes: frees the player's pieces once they're gone, and pauses an empty room. */
	private async dropped(by: string) {
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
		await saveTime(this.env, this.code, this.state.clock.played, {
			at: new Date(now),
			done: isComplete(this.state),
		});
	}

	/** Reads the player's name from D1 again and tells everyone. */
	private async rename(id: string) {
		const name = await readName(this.env, id);
		if (name === undefined) return;
		for (const ws of socketsOf(this.ctx.getWebSockets(), id))
			attach(ws, id, name);
		this.broadcast({ type: "presence", players: this.players() });
	}

	private players() {
		return playersOf(this.ctx.getWebSockets());
	}

	private send(ws: WebSocket, msg: ServerMsg) {
		ws.send(JSON.stringify(msg));
	}

	private broadcast(msg: ServerMsg) {
		broadcast(this.ctx.getWebSockets(), msg);
	}
}
