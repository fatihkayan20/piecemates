import { Ionicons } from "@expo/vector-icons";
import { formatDuration } from "@piecemates/client";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

import { useElapsed } from "@/hooks/use-elapsed";

import { WinCat } from "./win-cat";

const StyledIonicons = withUniwind(Ionicons);
/** Padding under the bar, on top of the home indicator inset (matches the controls). */
const BOTTOM_GAP = 12;
const ICON_SIZE = 20;

/** Takes the place of the controls once the puzzle is done. */
export function SolvedBar() {
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const ms = useElapsed();

	return (
		<View
			className="flex-row items-center justify-center gap-2 p-3"
			style={{ paddingBottom: insets.bottom + BOTTOM_GAP }}
		>
			<WinCat />
			<StyledIonicons
				name="trophy"
				size={ICON_SIZE}
				className="text-foreground"
			/>
			<Text className="font-medium text-foreground">
				{t("room.solvedIn", { time: formatDuration(ms) })}
			</Text>
		</View>
	);
}
