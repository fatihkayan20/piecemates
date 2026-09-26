import {
	BottomSheet,
	Host,
	Label,
	ShareLink,
	Text,
	VStack,
} from "@expo/ui/swift-ui";
import {
	buttonStyle,
	controlSize,
	font,
	foregroundStyle,
	frame,
	padding,
	presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
import { roomUrl } from "@puzzle/client";
import { MAX_PLAYERS } from "@puzzle/game";
import { useState } from "react";

import { useRoom } from "@/hooks/use-room";
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
	const players = useRoom((r) => r.players);
	const me = useRoom((r) => r.conn?.me);
	const status = useRoom((r) => r.status);
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
						// Full width, so short names sit on the left rather than centred.
						frame({ maxWidth: Number.POSITIVE_INFINITY, alignment: "leading" }),
						padding({ all: SHEET.padding }),
						presentationDragIndicator("visible"),
					]}
				>
					<Text
						modifiers={[font({ size: SHEET.titleSize, weight: "semibold" })]}
					>
						{`Players ${players.length} / ${MAX_PLAYERS}`}
					</Text>
					{(status === "connecting" || status === "disconnected") && (
						<Text modifiers={[foregroundStyle("secondary")]}>
							{`You are ${status}.`}
						</Text>
					)}
					{players.map((p) => (
						<Text key={p.id}>{p.id === me ? `${p.name} (you)` : p.name}</Text>
					))}
					<ShareLink
						item={roomUrl(ENV.EXPO_PUBLIC_WEB_URL, code)}
						modifiers={[buttonStyle("bordered"), controlSize("large")]}
					>
						<Label
							title="Share room link"
							systemImage="square.and.arrow.up"
							modifiers={[frame({ maxWidth: Number.POSITIVE_INFINITY })]}
						/>
					</ShareLink>
				</VStack>
			</BottomSheet>
		</Host>
	);
}
