/** Bag colours to pick from; the first is the default. */
export const BAG_COLORS = [
	"#38bdf8",
	"#4ade80",
	"#facc15",
	"#fb923c",
	"#f472b6",
	"#a78bfa",
];

/** The piece count a new room starts with, before the player picks one. */
const DEFAULT_PIECES = 100;

/** The grid option closest to DEFAULT_PIECES. */
export const defaultGrid = <T extends { count: number }>(options: T[]) =>
	options.reduce<T | undefined>(
		(best, o) =>
			!best ||
			Math.abs(o.count - DEFAULT_PIECES) < Math.abs(best.count - DEFAULT_PIECES)
				? o
				: best,
		undefined,
	);
