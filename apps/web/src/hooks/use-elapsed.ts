import { elapsed } from "@piecemates/game";
import { useEffect, useState } from "react";

import { useRoom } from "@/hooks/use-room";

const TICK_MS = 1000;

/** The room's play time in ms, ticking once a second while it runs. */
export function useElapsed() {
	const clock = useRoom((r) => r.clock);
	const [now, setNow] = useState(Date.now);
	const running = clock?.since != null;

	useEffect(() => {
		if (!running) return;
		setNow(Date.now());
		const id = setInterval(() => setNow(Date.now()), TICK_MS);
		return () => clearInterval(id);
	}, [running]);

	if (!clock) return 0;
	// ponytail: compares my clock to the server's; send server time if skew shows.
	return elapsed(clock, Math.max(now, clock.since ?? 0));
}
