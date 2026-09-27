import {
	BottomSheet,
	Button,
	HStack,
	Image,
	Spacer,
	Text,
} from "@expo/ui/swift-ui";
import { foregroundStyle } from "@expo/ui/swift-ui/modifiers";
import { useThemeColor } from "heroui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useSettings } from "@/hooks/use-settings";

import { MusicOptions } from "./music-options";

/** A Settings row with the current track; it opens a sheet to listen and pick. */
export function MusicPicker() {
	const { t } = useTranslation();
	const foreground = useThemeColor("foreground");
	const music = useSettings((s) => s.music);
	const [open, setOpen] = useState(false);

	return (
		<BottomSheet
			isPresented={open}
			onIsPresentedChange={setOpen}
			fitToContents
			anchor={
				<Button onPress={() => setOpen(true)}>
					<HStack>
						<Text modifiers={[foregroundStyle(foreground)]}>
							{t("settings.music")}
						</Text>
						<Spacer />
						<Text modifiers={[foregroundStyle("secondary")]}>
							{t(`music.${music ?? "off"}`)}
						</Text>
						<Image
							systemName="chevron.right"
							modifiers={[foregroundStyle("secondary")]}
						/>
					</HStack>
				</Button>
			}
		>
			<MusicOptions />
		</BottomSheet>
	);
}
