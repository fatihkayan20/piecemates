import { BottomSheet, Host, Text, VStack } from "@expo/ui/swift-ui";
import {
	font,
	padding,
	presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { SettingsControls } from "@/components/settings/settings-controls";

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
					<SettingsControls />
					<AbandonRoom code={code} onDone={() => setOpen(false)} />
				</VStack>
			</BottomSheet>
		</Host>
	);
}
