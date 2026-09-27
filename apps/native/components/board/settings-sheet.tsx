import { BottomSheet, Text, VStack } from "@expo/ui/swift-ui";
import { font, padding } from "@expo/ui/swift-ui/modifiers";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AppHost } from "@/components/app-host";
import { MusicSegments } from "@/components/settings/music-segments";
import { SettingsControls } from "@/components/settings/settings-controls";
import { useSheetStyle } from "@/hooks/use-sheet-style";

import { AbandonRoom } from "./abandon-room";

const SHEET = { spacing: 16, padding: 24, titleSize: 20 };
/** My own view settings (saved on this device) and Abandon. */
export function SettingsSheet({
	code,
	onClose,
}: {
	code: string;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const style = useSheetStyle();
	const [open, setOpen] = useState(true);

	return (
		<AppHost matchContents>
			<BottomSheet
				isPresented={open}
				onIsPresentedChange={setOpen}
				onDismiss={onClose}
				fitToContents
			>
				<VStack
					alignment="leading"
					spacing={SHEET.spacing}
					modifiers={[padding({ all: SHEET.padding }), ...style.sheet]}
				>
					<Text
						modifiers={[font({ size: SHEET.titleSize, weight: "semibold" })]}
					>
						{t("settings.title")}
					</Text>
					<SettingsControls />
					<MusicSegments />
					<AbandonRoom code={code} onDone={() => setOpen(false)} />
				</VStack>
			</BottomSheet>
		</AppHost>
	);
}
