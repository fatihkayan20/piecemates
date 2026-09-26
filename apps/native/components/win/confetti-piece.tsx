import type { ConfettiPiece as Piece } from "@puzzle/client";
import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";

const DEGREES_PER_TURN = 360;

/** One paper falling from above the top to below the bottom, spinning. */
export function ConfettiPiece({ piece }: { piece: Piece }) {
	const { width, height } = useWindowDimensions();
	const fall = useSharedValue(0);

	useEffect(() => {
		fall.value = withDelay(
			piece.delay,
			withTiming(1, {
				duration: piece.duration,
				easing: Easing.in(Easing.quad),
			}),
		);
	}, [fall, piece]);

	const style = useAnimatedStyle(() => ({
		transform: [
			{ translateY: -piece.height + fall.value * (height + piece.height) },
			{ rotate: `${fall.value * piece.turns * DEGREES_PER_TURN}deg` },
		],
	}));

	return (
		<Animated.View
			className="absolute top-0"
			style={[
				{
					left: piece.x * width,
					width: piece.width,
					height: piece.height,
					backgroundColor: piece.color,
				},
				style,
			]}
		/>
	);
}
