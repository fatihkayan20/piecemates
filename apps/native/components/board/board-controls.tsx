import type { RoomInfo } from "@piecemates/client";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SampleCredit } from "@/components/sample-credit";
import { useRoom } from "@/hooks/use-room";

import { PlayTime } from "./play-time";
import { ReferenceImage } from "./reference-image";

/** Padding under the controls, on top of the home indicator inset. */
const BOTTOM_GAP = 12;

/** The photo's credit on its own line, then play time, the reference image and Tidy, under the table. */
export function BoardControls({ room }: { room: RoomInfo }) {
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const conn = useRoom((r) => r.conn);

	return (
		<View
			className="flex-row flex-wrap items-center justify-end gap-2 p-3"
			style={{ paddingBottom: insets.bottom + BOTTOM_GAP }}
		>
			{room.credit && (
				<SampleCredit credit={room.credit} className="w-full text-muted" />
			)}
			<PlayTime />
			<ReferenceImage room={room} />
			<Pressable
				accessibilityRole="button"
				className="rounded bg-foreground px-3 py-1.5 active:opacity-70"
				onPress={() => conn?.tidy()}
			>
				<Text className="font-medium text-background">{t("room.tidy")}</Text>
			</Pressable>
		</View>
	);
}
