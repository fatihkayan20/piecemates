import { Button, HStack, Text, VStack } from "@expo/ui/swift-ui";
import { fixedSize, font, foregroundStyle } from "@expo/ui/swift-ui/modifiers";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { useRoom } from "@/hooks/use-room";
import { api } from "@/lib/api";

const SPACING = 8;

/** Abandon, with a confirm step, for an unsolved room; then back to the tabs. */
export function AbandonRoom({
	code,
	onDone,
}: {
	code: string;
	/** Closes the sheet before the room screen goes away. */
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const done = useRoom((r) => r.status === "done");
	const [confirming, setConfirming] = useState(false);
	if (done) return null;

	const abandon = async () => {
		try {
			await api.abandon(code);
			onDone();
			router.dismissTo("/");
		} catch {
			Alert.alert(t("room.abandonFailed"));
		}
	};

	if (!confirming)
		return (
			// biome-ignore lint/a11y/useValidAriaRole: a SwiftUI button role, not ARIA
			<Button
				label={t("room.abandon")}
				role="destructive"
				onPress={() => setConfirming(true)}
			/>
		);
	return (
		<VStack alignment="leading" spacing={SPACING}>
			<Text modifiers={[font({ weight: "semibold" })]}>
				{t("room.abandonTitle")}
			</Text>
			{/* Wraps instead of truncating in a fit-to-contents sheet. */}
			<Text
				modifiers={[
					foregroundStyle("secondary"),
					fixedSize({ horizontal: false, vertical: true }),
				]}
			>
				{t("room.abandonHint")}
			</Text>
			<HStack spacing={SPACING}>
				<Button
					label={t("room.keepPlaying")}
					onPress={() => setConfirming(false)}
				/>
				{/* biome-ignore lint/a11y/useValidAriaRole: a SwiftUI button role, not ARIA */}
				<Button
					label={t("room.abandonConfirm")}
					role="destructive"
					onPress={abandon}
				/>
			</HStack>
		</VStack>
	);
}
