import { Picker, Text } from "@expo/ui/swift-ui";
import { foregroundStyle, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { MUSIC_TRACKS, setMusic } from "@piecemates/client";
import { useTranslation } from "react-i18next";

import { useSettings } from "@/hooks/use-settings";

/** The picker's tag for no music. */
const OFF = "off";

/** Music as segments, for the room's sheet, where the chosen track already plays. */
export function MusicSegments() {
	const { t } = useTranslation();
	const music = useSettings((s) => s.music);
	return (
		<>
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
