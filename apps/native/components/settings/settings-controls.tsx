import { Picker, Text, Toggle } from "@expo/ui/swift-ui";
import { foregroundStyle, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import {
	BACKGROUNDS,
	MUSIC_TRACKS,
	setBackground,
	setHaptics,
	setMusic,
	setSounds,
} from "@piecemates/client";
import { useTranslation } from "react-i18next";

import { ColorSwatches } from "@/components/bags/color-swatches";
import { useSettings } from "@/hooks/use-settings";

/** The picker's tag for no music. */
const OFF = "off";

/** My view settings as SwiftUI rows, for the Settings tab and the room's sheet. */
export function SettingsControls() {
	const { t } = useTranslation();
	const background = useSettings((s) => s.background);
	const sounds = useSettings((s) => s.sounds);
	const haptics = useSettings((s) => s.haptics);
	const music = useSettings((s) => s.music);

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
			<Text modifiers={[foregroundStyle("secondary")]}>
				{t("settings.music")}
			</Text>
			<Picker
				selection={music ?? OFF}
				onSelectionChange={(track: string) =>
					setMusic(track === OFF ? null : track)
				}
				modifiers={[pickerStyle("segmented")]}
			>
				{([OFF, ...MUSIC_TRACKS] as const).map((track) => (
					<Text key={track} modifiers={[tag(track)]}>
						{t(`music.${track}`)}
					</Text>
				))}
			</Picker>
		</>
	);
}
