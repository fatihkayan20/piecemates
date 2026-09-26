import { type Cue, type CuePlayer, loadCues } from "@piecemates/client";

import snap from "@/assets/sounds/snap.wav";
import win from "@/assets/sounds/win.wav";

const SOUNDS: Record<Cue, string> = { snap, win };
/** Vibration length in ms; only some browsers (Android Chrome) vibrate. */
const BUZZ: Record<Cue, number> = { snap: 20, win: 150 };
/** Matches the wav files; only used to decode them. */
const SAMPLE_RATE = 22050;

const buffers = new Map<Cue, AudioBuffer>();
// Made on the first cue, which follows a drag, so the browser lets it play.
let context: AudioContext | undefined;

const webCues: CuePlayer = {
	sound(cue) {
		const buffer = buffers.get(cue);
		if (!buffer) return;
		context ??= new AudioContext();
		const source = context.createBufferSource();
		source.buffer = buffer;
		source.connect(context.destination);
		source.start();
	},
	haptic: (cue) => navigator.vibrate?.(BUZZ[cue]),
};

let loaded = false;

/**
 * Fetches and decodes every sound once, the first time a room opens, and
 * plays them from memory after that. Decoding needs no user gesture, unlike
 * a playing AudioContext.
 */
export function loadWebCues() {
	if (loaded) return;
	loaded = true;
	loadCues(webCues);
	const decoder = new OfflineAudioContext(1, 1, SAMPLE_RATE);
	for (const cue of ["snap", "win"] as const) {
		fetch(SOUNDS[cue])
			.then((res) => res.arrayBuffer())
			.then((data) => decoder.decodeAudioData(data))
			.then((buffer) => buffers.set(cue, buffer))
			.catch(() => {});
	}
}
