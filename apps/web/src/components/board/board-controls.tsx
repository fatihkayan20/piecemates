import type { RoomInfo } from "@piecemates/client";
import { Button } from "@piecemates/ui/components/button";
import { useTranslation } from "react-i18next";

import { SampleCredit } from "@/components/sample-credit";
import { useRoom } from "@/hooks/use-room";

import { PlayTime } from "./play-time";
import { ReferenceImage } from "./reference-image";

/** The photo's credit, play time, the reference image and Tidy, under the table. */
export function BoardControls({ room }: { room: RoomInfo }) {
	const { t } = useTranslation();
	const conn = useRoom((r) => r.conn);

	return (
		<div className="flex flex-wrap items-center justify-end gap-2 p-3">
			{room.credit && <SampleCredit credit={room.credit} className="mr-auto" />}
			<PlayTime />
			<ReferenceImage room={room} />
			<Button size="sm" onClick={() => conn?.tidy()}>
				{t("room.tidy")}
			</Button>
		</div>
	);
}
