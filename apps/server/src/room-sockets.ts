/// <reference path="../cloudflare-env.d.ts" />
import { createDb } from "@piecemates/db";
import { user } from "@piecemates/db/schema/auth";
import { rooms } from "@piecemates/db/schema/game";
import {
	ClientMsg,
	MAX_MESSAGES_PER_SECOND,
	MAX_NAME_LENGTH,
	type Player,
	RenameMsg,
	type ServerMsg,
	type State,
} from "@piecemates/game";
import { eq } from "drizzle-orm";

const SECOND_MS = 1000;
/** Sockets one player may hold in a room (tabs, devices); older ones close. */
const MAX_SOCKETS_PER_PLAYER = 3;
/** WebSocket close code for "policy violation". */
export const CLOSE_POLICY = 1008;

/** Stored on each socket: whose it is, and when it connected. */
export type Attachment = Player & { at: number };

/** The player a socket belongs to, stored on it when it connected. */
export const playerOf = (ws: WebSocket): Attachment =>
	ws.deserializeAttachment();

/** Stores whose a socket is (keeping when it first connected). */
export function attach(ws: WebSocket, id: string, name: string) {
	const at = ws.deserializeAttachment()?.at ?? Date.now();
	ws.serializeAttachment({ id, name, at } satisfies Attachment);
}

/** A player's open sockets, oldest first (getWebSockets has no order). */
export const socketsOf = (sockets: WebSocket[], id: string) =>
	sockets
		.filter((ws) => ws.readyState === WebSocket.OPEN && playerOf(ws).id === id)
		.sort((a, b) => playerOf(a).at - playerOf(b).at);

/** Closes a player's oldest sockets so a new one fits the cap: extra tabs can't multiply their messages. */
export function makeRoomFor(sockets: WebSocket[], id: string) {
	const theirs = socketsOf(sockets, id);
	const excess = theirs.length - (MAX_SOCKETS_PER_PLAYER - 1);
	for (const old of theirs.slice(0, Math.max(0, excess)))
		old.close(CLOSE_POLICY, "Too many connections");
}

/** Everyone connected, once each (a player may have several tabs or devices). */
export function playersOf(sockets: WebSocket[]): Player[] {
	const byId = new Map<string, Player>();
	for (const ws of sockets) {
		if (ws.readyState !== WebSocket.OPEN) continue;
		const { id, name } = playerOf(ws);
		byId.set(id, { id, name });
	}
	return [...byId.values()];
}

/** A player's name as the room shows it, read from D1. */
export async function readName(env: Env, id: string) {
	const [row] = await createDb(env)
		.select({ name: user.name })
		.from(user)
		.where(eq(user.id, id));
	return row?.name.slice(0, MAX_NAME_LENGTH);
}

/**
 * Counts each player's messages over all their sockets; `tooFast` is true
 * once one is over their per-second budget. Forgotten when the room
 * hibernates, which is fine.
 */
export function messageRate() {
	const rates = new Map<string, { since: number; count: number }>();
	return (ws: WebSocket) => {
		const now = Date.now();
		const { id } = playerOf(ws);
		const rate = rates.get(id);
		if (!rate || now - rate.since >= SECOND_MS) {
			rates.set(id, { since: now, count: 1 });
			return false;
		}
		rate.count++;
		return rate.count > MAX_MESSAGES_PER_SECOND;
	};
}

/** A socket message: a move, "rename", or null for anything else. */
export function parseMsg(
	data: string | ArrayBuffer,
): ClientMsg | "rename" | null {
	if (typeof data !== "string") return null;
	try {
		const json: unknown = JSON.parse(data);
		if (RenameMsg.safeParse(json).success) return "rename";
		const parsed = ClientMsg.safeParse(json);
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

/** Sends a message to every open socket. */
export function broadcast(sockets: WebSocket[], msg: ServerMsg) {
	const data = JSON.stringify(msg);
	for (const ws of sockets) if (ws.readyState === WebSocket.OPEN) ws.send(data);
}

/** Fills in what rooms made before the clock and rotation existed lack. */
export function upgrade(state: State | undefined) {
	if (state) {
		state.clock ??= { played: 0, since: null };
		state.rotate ??= false;
		for (const p of state.pieces) p.rot ??= 0;
	}
	return state;
}

/** Saves the room's played time for History, and when it was solved. */
export async function saveTime(
	env: Env,
	code: string,
	playedMs: number,
	{ at, done }: { at: Date; done: boolean },
) {
	await createDb(env)
		.update(rooms)
		.set({
			playedMs,
			playedAt: at,
			...(done && { status: "done", finishedAt: at }),
		})
		.where(eq(rooms.code, code));
}
