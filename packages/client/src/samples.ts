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
/** Phones start smaller, so the whole table fits without zooming. */
const PHONE_PIECES = 48;
/** A screen whose shorter side is under this (CSS px / points) is a phone. */
const PHONE_SHORT_SIDE = 600;

/** The grid option closest to the default piece count for this screen. */
export const defaultGrid = <T extends { count: number }>(
	options: T[],
	screen: { width: number; height: number },
) => {
	const target =
		Math.min(screen.width, screen.height) < PHONE_SHORT_SIDE
			? PHONE_PIECES
			: DEFAULT_PIECES;
	return options.reduce<T | undefined>(
		(best, o) =>
			!best || Math.abs(o.count - target) < Math.abs(best.count - target)
				? o
				: best,
		undefined,
	);
};
