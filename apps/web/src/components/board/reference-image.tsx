import type { RoomInfo } from "@piecemates/client";
import { Button } from "@piecemates/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@piecemates/ui/components/dialog";
import { useTranslation } from "react-i18next";

import { Photo } from "@/components/photo";
import { SampleCredit } from "@/components/sample-credit";

/** The dialog is at most 48rem wide. */
const DIALOG_SIZES = "(min-width: 48rem) 48rem, 100vw";

/** The Image button and a dialog with the finished picture. */
export function ReferenceImage({ room }: { room: RoomInfo }) {
	const { t } = useTranslation();
	return (
		<Dialog>
			<DialogTrigger render={<Button size="sm" variant="outline" />}>
				{t("room.image")}
			</DialogTrigger>
			<DialogContent className="sm:max-w-3xl">
				<DialogTitle>{t("room.referenceImage")}</DialogTitle>
				<Photo
					url={room.imageUrl}
					sizes={DIALOG_SIZES}
					alt={t("room.finishedPuzzle")}
					className="max-h-[75vh] w-full object-contain"
				/>
				{room.credit && <SampleCredit credit={room.credit} />}
			</DialogContent>
		</Dialog>
	);
}
