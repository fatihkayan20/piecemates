import {
	BottomSheet,
	Host,
	Picker,
	Text,
	Toggle,
	VStack,
} from "@expo/ui/swift-ui";
import {
	font,
	foregroundStyle,
	padding,
	pickerStyle,
	presentationDragIndicator,
	tag,
} from "@expo/ui/swift-ui/modifiers";
import {
	BACKGROUNDS,
	MUSIC_TRACKS,
	setBackground,
	setHaptics,
	setMusic,
	setSounds,
} from "@piecemates/client";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ColorSwatches } from "@/components/bags/color-swatches";
import { useSettings } from "@/hooks/use-settings";

const SHEET = { spacing: 16, padding: 24, titleSize: 20 };
/** The picker's tag for no music. */
const OFF = "off";

/** My own view settings, saved on this device. */
export function SettingsSheet({ onClose }: { onClose: () => void }) {
	const { t } = useTranslation();
	const background = useSettings((s) => s.background);
	const sounds = useSettings((s) => s.sounds);
	const haptics = useSettings((s) => s.haptics);
	const music = useSettings((s) => s.music);
	const [open, setOpen] = useState(true);

	return (
		<Host matchContents>
			<BottomSheet
				isPresented={open}
				onIsPresentedChange={setOpen}
				onDismiss={onClose}
				fitToContents
			>
				<VStack
					alignment="leading"
					spacing={SHEET.spacing}
					modifiers={[
						padding({ all: SHEET.padding }),
						presentationDragIndicator("visible"),
					]}
				>
					<Text
						modifiers={[font({ size: SHEET.titleSize, weight: "semibold" })]}
					>
						{t("settings.title")}
					</Text>
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
				</VStack>
			</BottomSheet>
		</Host>
	);
}
