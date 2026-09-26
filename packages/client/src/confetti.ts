import { BAG_COLORS } from "./samples.ts";

export const CONFETTI_COUNT = 80;
/** Slowest and fastest fall across the screen, and the latest start, in ms. */
const FALL_MIN_MS = 1800;
const FALL_MAX_MS = 3200;
const MAX_DELAY_MS = 1200;
/** Paper size in px and how many turns it makes on the way down. */
const SIZE_MIN = 6;
const SIZE_MAX = 12;
const MAX_TURNS = 3;
/** Paper is half as tall as it's wide. */
const PAPER_RATIO = 0.5;

export type ConfettiPiece = {
	/** Start position as a fraction of the width. */
	x: number;
	delay: number;
	duration: number;
	width: number;
	height: number;
	/** Turns while falling; negative spins the other way. */
	turns: number;
	color: string;
};

const between = (min: number, max: number, random: () => number) =>
	min + (max - min) * random();

/** Paper pieces for the win; each platform only animates them falling. */
export function makeConfetti(count = CONFETTI_COUNT, random = Math.random) {
	return Array.from({ length: count }, (_, i): ConfettiPiece => {
		const width = between(SIZE_MIN, SIZE_MAX, random);
		return {
			x: random(),
			delay: between(0, MAX_DELAY_MS, random),
			duration: between(FALL_MIN_MS, FALL_MAX_MS, random),
			width,
			height: width * PAPER_RATIO,
			turns: between(-MAX_TURNS, MAX_TURNS, random),
			color: BAG_COLORS[i % BAG_COLORS.length] ?? "",
		};
	});
}
