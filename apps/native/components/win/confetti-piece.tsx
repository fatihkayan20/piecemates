import type { ConfettiPiece as Piece } from "@puzzle/client";
import { useWindowDimensions } from "react-native";
import Animated from "react-native-reanimated";

const DEGREES_PER_TURN = 360;

/** One paper falling from above the top to below the bottom, spinning. */
export function ConfettiPiece({ piece }: { piece: Piece }) {
	const { width, height } = useWindowDimensions();

	return (
		<Animated.View
			className="absolute top-0"
			style={{
				left: piece.x * width,
				width: piece.width,
				height: piece.height,
				backgroundColor: piece.color,
				animationName: {
					from: {
						transform: [{ translateY: -piece.height }, { rotate: "0deg" }],
					},
					to: {
						transform: [
							{ translateY: height },
							{ rotate: `${piece.turns * DEGREES_PER_TURN}deg` },
						],
					},
				},
				animationDuration: piece.duration,
				animationDelay: piece.delay,
				animationTimingFunction: "ease-in",
				animationFillMode: "both",
			}}
		/>
	);
}
