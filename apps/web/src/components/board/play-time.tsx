import { formatDuration } from "@puzzle/client";
import { Timer } from "lucide-react";

import { chip } from "@/components/bags/bag-styles";
import { useElapsed } from "@/hooks/use-elapsed";

/** How long we've been playing; it only runs while someone is in the room. */
export function PlayTime() {
	const ms = useElapsed();

	return (
		<span className={`${chip} mr-auto text-sm text-white tabular-nums`}>
			<Timer className="size-4" />
			{formatDuration(ms)}
		</span>
	);
}
