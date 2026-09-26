import { type ConfettiPiece, makeConfetti } from "@piecemates/client";
import { useState } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** One piece falling from above the top to below the bottom, spinning. */
function fall(el: HTMLElement | null, p: ConfettiPiece) {
	el?.animate(
		[
			{ transform: "translateY(-100%) rotate(0turn)" },
			{ transform: `translateY(100vh) rotate(${p.turns}turn)` },
		],
		{ duration: p.duration, delay: p.delay, easing: "ease-in", fill: "both" },
	);
}

/** Confetti over the board, once. Skipped for people who turned motion down. */
export function Confetti() {
	const [pieces] = useState(() =>
		matchMedia(REDUCED_MOTION).matches ? [] : makeConfetti(),
	);

	return (
		<div
			aria-hidden
			className="pointer-events-none absolute inset-0 overflow-hidden"
		>
			{pieces.map((p, i) => (
				<span
					// biome-ignore lint/suspicious/noArrayIndexKey: the list never changes
					key={i}
					ref={(el) => fall(el, p)}
					className="absolute top-0"
					style={{
						left: `calc(${p.x} * 100%)`,
						width: p.width,
						height: p.height,
						backgroundColor: p.color,
					}}
				/>
			))}
		</div>
	);
}
