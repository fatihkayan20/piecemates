import { Circle, HStack } from "@expo/ui/swift-ui";
import {
	foregroundStyle,
	frame,
	onTapGesture,
	opacity,
} from "@expo/ui/swift-ui/modifiers";
import { BAG_COLORS } from "@piecemates/client";

const SWATCH = { size: 36, spacing: 14, dimmed: 0.35 };

/** Colours as SwiftUI circles (bag colours by default); the picked one is fully opaque. */
export function ColorSwatches({
	value,
	onChange,
	colors = BAG_COLORS,
}: {
	value: string;
	onChange: (color: string) => void;
	colors?: readonly string[];
}) {
	return (
		<HStack spacing={SWATCH.spacing}>
			{colors.map((c) => (
				<Circle
					key={c}
					modifiers={[
						foregroundStyle(c),
						frame({ width: SWATCH.size, height: SWATCH.size }),
						opacity(c === value ? 1 : SWATCH.dimmed),
						onTapGesture(() => onChange(c)),
					]}
				/>
			))}
		</HStack>
	);
}
