// The room's Durable Object is the authority: it runs apply() and broadcasts
// every accepted message in order. Clients run the same apply(), so state stays
// identical everywhere without sending positions of anything but the dropped piece.

export const MAX_PLAYERS = 4;
export const BAG_NAME_MAX = 40;

export type Piece = {
	x: number;
	y: number;
	/** Id of the snapped group; pieces start alone (group === own index). */
	group: number;
	/** Bag id, or null when the piece is on the table. */
	bag: string | null;
	/** False while the piece sits in its view's pile (the table's or its bag's). */
	touched: boolean;
};

export type Bag = { name: string; color: string };

export type State = {
	rows: number;
	cols: number;
	/** Piece cell size in table units. The board is [0, cols*w] x [0, rows*h]. */
	w: number;
	h: number;
	pieces: Piece[];
	/** group id -> player id */
	locks: Record<number, string>;
	/** bag id -> bag */
	bags: Record<string, Bag>;
};

export type Player = { id: string; name: string };
