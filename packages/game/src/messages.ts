import { z } from "zod";

import { BAG_NAME_MAX, type Clock, type Player, type State } from "./types.ts";

const pieceIndex = z.int().nonnegative();
/** Short random ids (bags.ts); no "_", so never "__proto__". */
const bagId = z.string().regex(/^[a-z0-9]{1,16}$/);
/** Printable text only: no control, format or bidi characters. */
const printable = /^\P{C}*$/u;

export const ClientMsg = z.discriminatedUnion("type", [
	z.object({ type: z.literal("lock"), piece: pieceIndex }),
	z.object({ type: z.literal("unlock"), piece: pieceIndex }),
	/** Turns the piece's group a quarter turn clockwise, in a rotation room. */
	z.object({ type: z.literal("rotate"), piece: pieceIndex }),
	z.object({
		type: z.literal("drop"),
		piece: pieceIndex,
		x: z.number(),
		y: z.number(),
	}),
	z.object({
		type: z.enum(["bag:create", "bag:update"]),
		bag: bagId,
		name: z.string().max(BAG_NAME_MAX).regex(printable),
		color: z.string().regex(/^#[0-9a-f]{6}$/i),
	}),
	z.object({ type: z.literal("bag:delete"), bag: bagId }),
	/** Moves the piece's whole group into a bag, or back to the table (null). */
	z.object({
		type: z.literal("bag:put"),
		piece: pieceIndex,
		bag: bagId.nullable(),
	}),
]);
export type ClientMsg = z.infer<typeof ClientMsg>;

/** Not a move: asks the room to read my name again after I picked one. The server reads it; clients can't send one. */
export const RenameMsg = z.object({ type: z.literal("rename") });

/** `leave` is only produced by the server when a socket closes. */
export type Msg = ClientMsg | { type: "leave" };

export type ServerMsg =
	| { type: "state"; state: State; you: string }
	| { type: "applied"; by: string; msg: Msg }
	| { type: "rejected"; msg: ClientMsg }
	| { type: "presence"; players: Player[] }
	| { type: "clock"; clock: Clock };
