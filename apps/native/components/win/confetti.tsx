import { makeConfetti } from "@puzzle/client";
import { useState } from "react";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { ConfettiPiece } from "./confetti-piece";

/** Confetti over the board, once. Skipped for people who turned motion down. */
export function Confetti() {
	const [pieces] = useState(() => makeConfetti());
	const reduced = useReducedMotion();
	if (reduced) return null;

	return (
		<View pointerEvents="none" className="absolute inset-0 overflow-hidden">
			{pieces.map((piece, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: the list never changes
				<ConfettiPiece key={i} piece={piece} />
			))}
		</View>
	);
}
