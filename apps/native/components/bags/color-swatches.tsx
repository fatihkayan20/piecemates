import { Circle, HStack } from "@expo/ui/swift-ui";
import {
	foregroundStyle,
	frame,
	onTapGesture,
	opacity,
} from "@expo/ui/swift-ui/modifiers";
import { BAG_COLORS } from "@puzzle/client";

const SWATCH = { size: 36, spacing: 14, dimmed: 0.35 };

/** The bag colours as SwiftUI circles; the picked one is fully opaque. */
export function ColorSwatches({
	value,
	onChange,
}: {
	value: string;
	onChange: (color: string) => void;
}) {
	return (
		<HStack spacing={SWATCH.spacing}>
			{BAG_COLORS.map((c) => (
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
