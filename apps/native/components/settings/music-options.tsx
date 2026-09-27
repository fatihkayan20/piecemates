import { Button, Text, VStack } from "@expo/ui/swift-ui";
import {
	controlSize,
	font,
	foregroundStyle,
	frame,
	padding,
} from "@expo/ui/swift-ui/modifiers";
import { MUSIC_TRACKS, setMusic } from "@piecemates/client";
import { useTranslation } from "react-i18next";

import { useMusic } from "@/hooks/use-music";
import { useSettings } from "@/hooks/use-settings";
import { useSheetStyle } from "@/hooks/use-sheet-style";

const SHEET = { spacing: 12, padding: 24, titleSize: 20 };

/** The music sheet: the chosen track plays while it's open, so I hear before I keep it. */
export function MusicOptions() {
	const { t } = useTranslation();
	const style = useSheetStyle();
	const music = useSettings((s) => s.music);
	useMusic();

	return (
		<VStack
			alignment="leading"
			spacing={SHEET.spacing}
			modifiers={[padding({ all: SHEET.padding }), ...style.sheet]}
		>
			<Text modifiers={[font({ size: SHEET.titleSize, weight: "semibold" })]}>
				{t("settings.music")}
			</Text>
			<Text modifiers={[foregroundStyle("secondary")]}>
				{t("settings.musicHint")}
			</Text>
			{([null, ...MUSIC_TRACKS] as const).map((track) => (
				<Button
					key={track ?? "off"}
					onPress={() => setMusic(track)}
					modifiers={[
						...(track === music ? style.prominent : style.button),
						controlSize("large"),
					]}
				>
					<Text modifiers={[frame({ maxWidth: Number.POSITIVE_INFINITY })]}>
						{t(`music.${track ?? "off"}`)}
					</Text>
				</Button>
			))}
		</VStack>
	);
}
