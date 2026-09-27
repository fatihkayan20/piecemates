import { z } from "zod";

import { BAG_NAME_MAX, type Clock, type Player, type State } from "./types.ts";

/** Long enough for any CSS colour we pick, e.g. "#38bdf8" or "rgb(…)". */
const COLOR_MAX = 20;

const pieceIndex = z.int().nonnegative();

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
		bag: z.string().min(1).max(BAG_NAME_MAX),
		name: z.string().max(BAG_NAME_MAX),
		color: z.string().max(COLOR_MAX),
	}),
	z.object({ type: z.literal("bag:delete"), bag: z.string() }),
	/** Moves the piece's whole group into a bag, or back to the table (null). */
	z.object({
		type: z.literal("bag:put"),
		piece: pieceIndex,
		bag: z.string().nullable(),
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
