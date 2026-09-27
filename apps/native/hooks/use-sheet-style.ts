import {
	buttonStyle,
	foregroundStyle,
	presentationBackground,
	presentationDragIndicator,
	tint,
} from "@expo/ui/swift-ui/modifiers";
import { useThemeColor } from "heroui-native";

/**
 * SwiftUI sheets in the app's monochrome look: the app background instead of
 * the system material, and buttons in the foreground colour instead of blue
 * (filled ones get background-coloured labels). Toggles keep the system green.
 */
export function useSheetStyle() {
	const background = useThemeColor("background");
	const foreground = useThemeColor("foreground");
	return {
		sheet: [
			presentationBackground(background),
			presentationDragIndicator("visible"),
		],
		button: [buttonStyle("bordered"), tint(foreground)],
		prominent: [
			buttonStyle("borderedProminent"),
			tint(foreground),
			foregroundStyle(background),
		],
	};
}
