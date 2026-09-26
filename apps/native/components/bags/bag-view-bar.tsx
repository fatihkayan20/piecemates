import { type BagChip, DROP_TABLE } from "@piecemates/client";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useDropTarget } from "@/hooks/use-drop-target";
import { useRoom } from "@/hooks/use-room";

import { BagLabel } from "./bag-label";
import { chip, dashed, ring } from "./bag-styles";

/** The bar inside a bag: back to the table, the bag (tap to edit) and a take-out zone. */
export function BagViewBar({
	bag,
	onEdit,
}: {
	bag: BagChip;
	onEdit: () => void;
}) {
	const { t } = useTranslation();
	const conn = useRoom((r) => r.conn);
	const takeOut = useDropTarget(DROP_TABLE);
	return (
		<>
			<Pressable
				accessibilityRole="button"
				className={`${chip} bg-foreground/15`}
				onPress={() => conn?.setView(null)}
			>
				<Text className="text-foreground">{t("bags.backToTable")}</Text>
			</Pressable>
			<Pressable accessibilityRole="button" className={chip} onPress={onEdit}>
				<BagLabel bag={bag} />
			</Pressable>
			<View
				ref={takeOut.ref}
				className={`${chip} ${dashed} ${ring(takeOut.hovered)}`}
			>
				<Text className="text-foreground">{t("bags.takeOut")}</Text>
			</View>
		</>
	);
}
