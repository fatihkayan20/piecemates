import { formatDuration } from "@puzzle/client";
import { PartyPopper } from "lucide-react";

import { useElapsed } from "@/hooks/use-elapsed";

/** Takes the place of the controls once the puzzle is done. */
export function SolvedBar() {
	const ms = useElapsed();

	return (
		<div className="flex items-center justify-center gap-2 p-3 font-medium text-white">
			<PartyPopper className="size-5" />
			Solved in {formatDuration(ms)}
		</div>
	);
}
