import { BottomSheet, Host, Text, Toggle, VStack } from "@expo/ui/swift-ui";
import {
	font,
	foregroundStyle,
	padding,
	presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
import {
	BACKGROUNDS,
	setBackground,
	setHaptics,
	setSounds,
} from "@piecemates/client";
import { useState } from "react";

import { ColorSwatches } from "@/components/bags/color-swatches";
import { useSettings } from "@/hooks/use-settings";

const SHEET = { spacing: 16, padding: 24, titleSize: 20 };

/** My own view settings, saved on this device. */
export function SettingsSheet({ onClose }: { onClose: () => void }) {
	const background = useSettings((s) => s.background);
	const sounds = useSettings((s) => s.sounds);
	const haptics = useSettings((s) => s.haptics);
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
						Settings
					</Text>
					<Text modifiers={[foregroundStyle("secondary")]}>Background</Text>
					<ColorSwatches
						colors={BACKGROUNDS}
						value={background}
						onChange={setBackground}
					/>
					<Toggle label="Sounds" isOn={sounds} onIsOnChange={setSounds} />
					<Toggle label="Haptics" isOn={haptics} onIsOnChange={setHaptics} />
				</VStack>
			</BottomSheet>
		</Host>
	);
}
