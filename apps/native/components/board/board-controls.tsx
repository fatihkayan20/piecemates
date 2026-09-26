import type { RoomInfo } from "@puzzle/client";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRoom } from "@/hooks/use-room";

import { PlayTime } from "./play-time";
import { ReferenceImage } from "./reference-image";

/** Padding under the controls, on top of the home indicator inset. */
const BOTTOM_GAP = 12;

/** Play time, the reference image and Tidy, under the table. */
export function BoardControls({ room }: { room: RoomInfo }) {
	const insets = useSafeAreaInsets();
	const conn = useRoom((r) => r.conn);

	return (
		<View
			className="flex-row items-center justify-end gap-2 p-3"
			style={{ paddingBottom: insets.bottom + BOTTOM_GAP }}
		>
			<PlayTime />
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
