import { Button, Image, Text, VStack } from "@expo/ui/swift-ui";
import {
	buttonStyle,
	controlSize,
	fixedSize,
	font,
	foregroundStyle,
	frame,
	multilineTextAlignment,
	tint,
} from "@expo/ui/swift-ui/modifiers";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { useSheetStyle } from "@/hooks/use-sheet-style";
import { api } from "@/lib/api";

const LAYOUT = { spacing: 12, icon: 40, titleSize: 20 };
const FULL = frame({ maxWidth: Number.POSITIVE_INFINITY });

/** The settings sheet's second face: asks before abandoning, then back to the tabs. */
export function AbandonConfirm({
	code,
	onCancel,
	onDone,
}: {
	code: string;
	onCancel: () => void;
	/** Closes the sheet before the room screen goes away. */
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const style = useSheetStyle();
	const danger = useThemeColor("danger");
	const onDanger = useThemeColor("danger-foreground");
	const { mutateAsync } = useMutation(api.abandon());

	const abandon = async () => {
		try {
			await mutateAsync(code);
			onDone();
			router.dismissTo("/");
		} catch {
			Alert.alert(t("room.abandonFailed"));
		}
	};

	return (
		<VStack
			spacing={LAYOUT.spacing}
			modifiers={[
				frame({
					maxWidth: Number.POSITIVE_INFINITY,
					maxHeight: Number.POSITIVE_INFINITY,
				}),
			]}
		>
			<Image systemName="flag.fill" size={LAYOUT.icon} color={danger} />
			<Text modifiers={[font({ size: LAYOUT.titleSize, weight: "semibold" })]}>
				{t("room.abandonTitle")}
			</Text>
			<Text
				modifiers={[
					foregroundStyle("secondary"),
					multilineTextAlignment("center"),
					fixedSize({ horizontal: false, vertical: true }),
				]}
			>
				{t("room.abandonHint")}
			</Text>
			<Button
				onPress={abandon}
				modifiers={[
					buttonStyle("borderedProminent"),
					tint(danger),
					foregroundStyle(onDanger),
					controlSize("large"),
				]}
			>
				<Text modifiers={[FULL]}>{t("room.abandonConfirm")}</Text>
			</Button>
			<Button
				onPress={onCancel}
				modifiers={[...style.button, controlSize("large")]}
			>
				<Text modifiers={[FULL]}>{t("room.keepPlaying")}</Text>
			</Button>
		</VStack>
	);
}
