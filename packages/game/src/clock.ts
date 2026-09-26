import { isComplete } from "./state.ts";
import type { Clock, State } from "./types.ts";

/** Starts counting when someone is in the room, unless the puzzle is already solved. */
export function resume(state: State, now: number) {
	if (state.clock.since === null && !isComplete(state)) state.clock.since = now;
}

/** Stops counting (everyone left, or it's solved) and keeps what was played so far. */
export function pause(state: State, now: number) {
	const { clock } = state;
	if (clock.since === null) return;
	clock.played += now - clock.since;
	clock.since = null;
}

/** Time played in ms, counting only while someone was in the room. */
export const elapsed = (clock: Clock, now: number) =>
	clock.played + (clock.since === null ? 0 : now - clock.since);
