/// <reference path="../cloudflare-env.d.ts" />
import { createDb } from "@piecemates/db";
import { user } from "@piecemates/db/schema/auth";
import {
	MAX_MESSAGES_PER_SECOND,
	MAX_NAME_LENGTH,
	type Player,
} from "@piecemates/game";
import { eq } from "drizzle-orm";

const SECOND_MS = 1000;

/** The player a socket belongs to, stored on it when it connected. */
export const playerOf = (ws: WebSocket): Player => ws.deserializeAttachment();

/** Everyone connected, once each (a player may have several tabs or devices). */
export function playersOf(sockets: WebSocket[]): Player[] {
	const byId = new Map<string, Player>();
	for (const ws of sockets) {
		if (ws.readyState !== WebSocket.OPEN) continue;
		const p = playerOf(ws);
		byId.set(p.id, p);
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
 * Counts each socket's messages; `tooFast` is true once one is over its
 * per-second budget. Forgotten when the room hibernates, which is fine.
 */
export function messageRate() {
	const rates = new WeakMap<WebSocket, { since: number; count: number }>();
	return (ws: WebSocket) => {
		const now = Date.now();
		const rate = rates.get(ws);
		if (!rate || now - rate.since >= SECOND_MS) {
			rates.set(ws, { since: now, count: 1 });
			return false;
		}
		rate.count++;
		return rate.count > MAX_MESSAGES_PER_SECOND;
	};
}
