import { Button, ConfirmationDialog, Text } from "@expo/ui/swift-ui";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { useRoom } from "@/hooks/use-room";
import { api } from "@/lib/api";

/** Abandon, confirmed in a native dialog, for an unsolved room; then back to the tabs. */
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

	return (
		<ConfirmationDialog
			title={t("room.abandonTitle")}
			titleVisibility="visible"
			isPresented={confirming}
			onIsPresentedChange={setConfirming}
		>
			<ConfirmationDialog.Trigger>
				{/* biome-ignore lint/a11y/useValidAriaRole: a SwiftUI button role, not ARIA */}
				<Button
					label={t("room.abandon")}
					role="destructive"
					onPress={() => setConfirming(true)}
				/>
			</ConfirmationDialog.Trigger>
			<ConfirmationDialog.Actions>
				{/* biome-ignore lint/a11y/useValidAriaRole: a SwiftUI button role, not ARIA */}
				<Button
					label={t("room.abandonConfirm")}
					role="destructive"
					onPress={abandon}
				/>
				{/* biome-ignore lint/a11y/useValidAriaRole: a SwiftUI button role, not ARIA */}
				<Button label={t("room.keepPlaying")} role="cancel" />
			</ConfirmationDialog.Actions>
			<ConfirmationDialog.Message>
				<Text>{t("room.abandonHint")}</Text>
			</ConfirmationDialog.Message>
		</ConfirmationDialog>
	);
}
