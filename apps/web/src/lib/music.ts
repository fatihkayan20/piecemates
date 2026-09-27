import { MUSIC_VOLUME, type MusicTrack } from "@piecemates/client";

import calm from "@/assets/music/calm.m4a";
import drift from "@/assets/music/drift.m4a";
import night from "@/assets/music/night.m4a";

const TRACKS: Record<MusicTrack, string> = { calm, drift, night };

/**
 * Loops a track until the returned stop is called. Browsers block sound until
 * the page has been touched, so a blocked start waits for the next press.
 */
export function playMusic(track: MusicTrack) {
	const audio = new Audio(TRACKS[track]);
	audio.loop = true;
	audio.volume = MUSIC_VOLUME;
	const retry = () => void audio.play().catch(() => {});
	audio
		.play()
		.catch(() => window.addEventListener("pointerdown", retry, { once: true }));
	return () => {
		window.removeEventListener("pointerdown", retry);
		audio.pause();
	};
}
