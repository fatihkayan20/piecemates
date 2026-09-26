import type { Cue, CuePlayer } from "@puzzle/client";
import { loadCues } from "@puzzle/client";
import {
	type AudioPlayer,
	createAudioPlayer,
	setAudioModeAsync,
} from "expo-audio";
import * as Haptics from "expo-haptics";

const SOUNDS: Record<Cue, number> = {
	snap: require("@/assets/sounds/snap.wav"),
	win: require("@/assets/sounds/win.wav"),
};

const players = new Map<Cue, AudioPlayer>();

const nativeCues: CuePlayer = {
	sound(cue) {
		const player = players.get(cue);
		if (!player) return;
		// ponytail: one player per sound, so a quick second snap restarts the first; a pool if that's noticeable.
		void player.seekTo(0);
		player.play();
	},
	haptic(cue) {
		if (cue === "win")
			void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
	},
};

let loaded = false;

/**
 * Loads every sound once, the first time a room opens, and plays them from
 * memory after that.
 */
export function loadNativeCues() {
	if (loaded) return;
	loaded = true;
	loadCues(nativeCues);
	// Sound effects: quiet on the mute switch, and never stop the user's music.
	void setAudioModeAsync({
		playsInSilentMode: false,
		interruptionMode: "mixWithOthers",
	});
	for (const cue of ["snap", "win"] as const)
		players.set(cue, createAudioPlayer(SOUNDS[cue]));
}
