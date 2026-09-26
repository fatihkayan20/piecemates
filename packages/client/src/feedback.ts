import { groupOf, isPlaced, type State } from "@piecemates/game";

import { settingsStore } from "./settings.ts";

/** What just happened that deserves a sound and a buzz. */
export type Cue = "snap" | "win";
export type CuePlayer = {
	sound: (cue: Cue) => void;
	haptic: (cue: Cue) => void;
};

let player: CuePlayer | undefined;

/** Each app hands over how it plays sounds and haptics. */
export const loadCues = (platform: CuePlayer) => {
	player = platform;
};

/** Plays a cue, as far as my settings allow. */
export function cue(kind: Cue) {
	const { sounds, haptics } = settingsStore.getState();
	if (sounds) player?.sound(kind);
	if (haptics) player?.haptic(kind);
}

/** Grows when a drop joins the piece's group to others or sticks it to the board. */
export const progress = (state: State, piece: number) =>
	groupOf(state, piece).length + (isPlaced(state, piece) ? 1 : 0);
