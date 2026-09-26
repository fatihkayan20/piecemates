import type { RoomInfo } from "@puzzle/client";
import { MAX_PLAYERS } from "@puzzle/game";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRoom } from "@/hooks/use-room";

import { ReferenceImage } from "./reference-image";
import { ShareRoom } from "./share-room";

/** Padding under the controls, on top of the home indicator inset. */
const BOTTOM_GAP = 12;

/** Room code, players, the reference image and Tidy, under the table. */
export function BoardControls({ room }: { room: RoomInfo }) {
	const insets = useSafeAreaInsets();
	const conn = useRoom((r) => r.conn);
	const players = useRoom((r) => r.players.length);
	const status = useRoom((r) => r.status);
	const note =
		status === "playing"
			? ""
			: ` · ${status === "done" ? "Solved! 🎉" : status}`;

	return (
		<View
			className="flex-row items-center gap-2 p-3"
			style={{ paddingBottom: insets.bottom + BOTTOM_GAP }}
		>
			<ShareRoom code={room.code} />
			<Text className="rounded bg-black/60 px-2 py-1 text-white">
				{players} / {MAX_PLAYERS}
				{note}
			</Text>
			<ReferenceImage room={room} />
			<Pressable
				accessibilityRole="button"
				className="rounded bg-white px-3 py-1.5 active:opacity-70"
				onPress={() => conn?.tidy()}
			>
				<Text className="font-medium text-black">Tidy pile</Text>
			</Pressable>
		</View>
	);
}
