import { formatDuration } from "@piecemates/client";
import { PartyPopper } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useElapsed } from "@/hooks/use-elapsed";

/** Takes the place of the controls once the puzzle is done. */
export function SolvedBar() {
	const { t } = useTranslation();
	const ms = useElapsed();

	return (
		<div className="flex items-center justify-center gap-2 p-3 font-medium">
			<PartyPopper className="size-5" />
			{t("room.solvedIn", { time: formatDuration(ms) })}
		</div>
	);
}
