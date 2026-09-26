import { type BagChip, DROP_TABLE } from "@piecemates/client";
import { Button } from "@piecemates/ui/components/button";
import { useTranslation } from "react-i18next";

import { useDropTarget } from "@/hooks/use-drop-target";
import { useRoom } from "@/hooks/use-room";

import { BagLabel } from "./bag-label";
import { chip, dashed, ring } from "./bag-styles";

/** The bar inside a bag: back to the table, the bag (click to edit) and a take-out zone. */
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
			<Button size="sm" variant="outline" onClick={() => conn?.setView(null)}>
				{t("bags.backToTable")}
			</Button>
			<button type="button" className={chip} onClick={onEdit}>
				<BagLabel bag={bag} />
			</button>
			<div
				ref={takeOut.ref}
				className={`${chip} ${dashed} ${ring(takeOut.hovered)}`}
			>
				{t("bags.takeOut")}
			</div>
		</>
	);
}
