import {
	BottomSheet,
	Button,
	Label,
	Text,
	VStack,
	ZStack,
} from "@expo/ui/swift-ui";
import {
	Animation,
	accessibilityHidden,
	animation,
	buttonStyle,
	controlSize,
	disabled,
	font,
	frame,
	opacity,
	padding,
	tint,
} from "@expo/ui/swift-ui/modifiers";
import { useThemeColor } from "heroui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AppHost } from "@/components/app-host";
import { MusicSegments } from "@/components/settings/music-segments";
import { SettingsControls } from "@/components/settings/settings-controls";
import { useRoom } from "@/hooks/use-room";
import { useSheetStyle } from "@/hooks/use-sheet-style";

import { AbandonConfirm } from "./abandon-confirm";

const SHEET = { spacing: 16, padding: 24, titleSize: 20 };

/**
 * My own view settings (saved on this device) and Abandon. Abandon turns the
 * sheet into its confirmation in place: the settings stay laid out underneath,
 * so the sheet keeps its height.
 */
export function SettingsSheet({
	code,
	onClose,
}: {
	code: string;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const style = useSheetStyle();
	const danger = useThemeColor("danger");
	const done = useRoom((r) => r.status === "done");
	const [open, setOpen] = useState(true);
	const [confirming, setConfirming] = useState(false);

	return (
		<AppHost matchContents>
			<BottomSheet
				isPresented={open}
				onIsPresentedChange={setOpen}
				onDismiss={onClose}
				fitToContents
			>
				<ZStack
					modifiers={[
						padding({ all: SHEET.padding }),
						...style.sheet,
						animation(Animation.easeInOut(), confirming),
					]}
				>
					<VStack
						alignment="leading"
						spacing={SHEET.spacing}
						modifiers={[
							opacity(confirming ? 0 : 1),
							disabled(confirming),
							accessibilityHidden(confirming),
						]}
					>
						<Text
							modifiers={[font({ size: SHEET.titleSize, weight: "semibold" })]}
						>
							{t("settings.title")}
						</Text>
						<SettingsControls />
						<MusicSegments />
						{!done && (
							<Button
								onPress={() => setConfirming(true)}
								modifiers={[
									buttonStyle("bordered"),
									tint(danger),
									controlSize("large"),
								]}
							>
								<Label
									title={t("room.abandon")}
									systemImage="flag"
									modifiers={[frame({ maxWidth: Number.POSITIVE_INFINITY })]}
								/>
							</Button>
						)}
					</VStack>
					{confirming && (
						<AbandonConfirm
							code={code}
							onCancel={() => setConfirming(false)}
							onDone={() => setOpen(false)}
						/>
					)}
				</ZStack>
			</BottomSheet>
		</AppHost>
	);
}
