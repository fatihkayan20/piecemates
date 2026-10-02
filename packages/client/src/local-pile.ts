import {
	MAX_TABLE_ASPECT,
	type Point,
	pileSlots,
	type State,
	slotRank,
	tableRect,
	tidyPositions,
} from "@piecemates/game";

/** Screen shapes closer than this share a layout, so a resize doesn't build a new one per pixel. */
const ASPECT_STEP = 0.05;

/**
 * This device's own pile. Untouched pieces are drawn in slots shaped to my
 * screen (the same rank as their slot in the room's layout), or where my last
 * tidy put them. Only moved pieces use the room's positions.
 */
export class LocalPile {
	/** My board's width / height; undefined draws the room's own layout. */
	aspect: number | undefined;
	private tidied = new Map<number, Point>();

	/** Lays my pile out for a new screen shape; earlier tidy spots don't fit it. */
	shape(aspect: number) {
		const clamped = Math.min(
			MAX_TABLE_ASPECT,
			Math.max(1 / MAX_TABLE_ASPECT, aspect),
		);
		this.aspect = Math.round(clamped / ASPECT_STEP) * ASPECT_STEP;
		this.tidied.clear();
	}

	/** Where I draw an untouched piece, or null to use the room's position. */
	at(state: State, index: number): Point | null {
		const piece = state.pieces[index];
		if (!piece || piece.touched) return null;
		const tidied = this.tidied.get(index);
		if (tidied) return tidied;
		const rank = slotRank(state, piece);
		return rank === undefined
			? null
			: (pileSlots(state, this.aspect)[rank] ?? null);
	}

	/** My table: the room's board and my pile around it. */
	table(state: State) {
		return tableRect(state, this.aspect ?? state.aspect);
	}

	/** Packs a view's pile into my first slots, keeping its order. */
	tidy(state: State, view: string | null, positionOf: (i: number) => Point) {
		const slots = pileSlots(state, this.aspect ?? state.aspect);
		for (const [i, p] of tidyPositions(state, view, positionOf, slots))
			this.tidied.set(i, p);
	}

	/** Forgets a piece's tidy spot (it changed view, so it has a new slot). */
	forget(index: number) {
		this.tidied.delete(index);
	}
}
