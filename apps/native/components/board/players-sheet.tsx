import { BottomSheet, Host, Text, VStack } from "@expo/ui/swift-ui";
import {
	font,
	foregroundStyle,
	frame,
	padding,
	presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
import { MAX_PLAYERS } from "@puzzle/game";
import { useState } from "react";

import { useRoom } from "@/hooks/use-room";

const SHEET = { spacing: 12, padding: 24, titleSize: 20 };

/** Who is in the room, and my connection if it isn't live. */
export function PlayersSheet({ onClose }: { onClose: () => void }) {
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
				</VStack>
			</BottomSheet>
		</Host>
	);
}
