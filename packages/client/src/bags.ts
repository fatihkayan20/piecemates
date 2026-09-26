import type { Bag } from "@piecemates/game";

import { BAG_COLORS } from "./samples.ts";

const ID_RADIX = 36;
/** Skips "0." in Math.random().toString(). */
const ID_START = 2;
const ID_LENGTH = 8;

/** A random bag id, short enough to read in logs. */
export const newBagId = () =>
	Math.random()
		.toString(ID_RADIX)
		.slice(ID_START, ID_START + ID_LENGTH);

/** What the create sheet starts with when there are `count` bags already. */
export const newBag = (count: number): Bag => ({
	name: `Bag ${count + 1}`,
	color: BAG_COLORS[0] ?? "",
});
