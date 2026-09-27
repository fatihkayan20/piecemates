import { Text, Toggle } from "@expo/ui/swift-ui";
import { foregroundStyle } from "@expo/ui/swift-ui/modifiers";
import {
	BACKGROUNDS,
	setBackground,
	setHaptics,
	setSounds,
} from "@piecemates/client";
import { useTranslation } from "react-i18next";

import { ColorSwatches } from "@/components/bags/color-swatches";
import { useSettings } from "@/hooks/use-settings";

/** My view settings as SwiftUI rows, for the Settings tab and the room's sheet; each adds its own music control. */
export function SettingsControls() {
	const { t } = useTranslation();
	const background = useSettings((s) => s.background);
	const sounds = useSettings((s) => s.sounds);
	const haptics = useSettings((s) => s.haptics);

	return (
		<>
			<Text modifiers={[foregroundStyle("secondary")]}>
				{t("settings.background")}
			</Text>
			<ColorSwatches
				colors={BACKGROUNDS}
				value={background}
				onChange={setBackground}
			/>
			<Toggle
				label={t("settings.sounds")}
				isOn={sounds}
				onIsOnChange={setSounds}
			/>
			<Toggle
				label={t("settings.haptics")}
				isOn={haptics}
				onIsOnChange={setHaptics}
			/>
		</>
	);
}
