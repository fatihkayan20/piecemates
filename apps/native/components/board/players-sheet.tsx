import { BottomSheet, Button, Label, Text, VStack } from "@expo/ui/swift-ui";
import {
	controlSize,
	font,
	foregroundStyle,
	frame,
	padding,
} from "@expo/ui/swift-ui/modifiers";
import { roomUrl } from "@piecemates/client";
import { MAX_PLAYERS } from "@piecemates/game";
import { track } from "@piecemates/telemetry";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Share } from "react-native";

import { AppHost } from "@/components/app-host";
import { useRoom } from "@/hooks/use-room";
import { useSheetStyle } from "@/hooks/use-sheet-style";
import { ENV } from "@/src/env";

const SHEET = { spacing: 12, padding: 24, titleSize: 20 };

/** Who is in the room, its share link, and my connection if it isn't live. */
export function PlayersSheet({
	code,
	onClose,
}: {
	code: string;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const style = useSheetStyle();
	const players = useRoom((r) => r.players);
	const me = useRoom((r) => r.conn?.me);
	const status = useRoom((r) => r.status);
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
					modifiers={[
						// Full width, so short names sit on the left rather than centred.
						frame({ maxWidth: Number.POSITIVE_INFINITY, alignment: "leading" }),
						padding({ all: SHEET.padding }),
						...style.sheet,
					]}
				>
					<Text
						modifiers={[font({ size: SHEET.titleSize, weight: "semibold" })]}
					>
						{t("players.count", { count: players.length, max: MAX_PLAYERS })}
					</Text>
					{(status === "connecting" || status === "disconnected") && (
						<Text modifiers={[foregroundStyle("secondary")]}>
							{status === "connecting"
								? t("players.connecting")
								: t("players.disconnected")}
						</Text>
					)}
					{players.map((p) => (
						<Text key={p.id}>
							{p.id === me ? t("players.me", { name: p.name }) : p.name}
						</Text>
					))}
					{/* A Button, not ShareLink, so the share can be counted. */}
					<Button
						onPress={() => {
							track("room_shared", {});
							void Share.share({ url: roomUrl(ENV.EXPO_PUBLIC_WEB_URL, code) });
						}}
						modifiers={[...style.button, controlSize("large")]}
					>
						<Label
							title={t("players.share")}
							systemImage="square.and.arrow.up"
							modifiers={[frame({ maxWidth: Number.POSITIVE_INFINITY })]}
						/>
					</Button>
				</VStack>
			</BottomSheet>
		</AppHost>
	);
}
