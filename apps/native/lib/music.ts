import { MUSIC_VOLUME, type MusicTrack } from "@piecemates/client";
import { createAudioPlayer } from "expo-audio";

const TRACKS: Record<MusicTrack, number> = {
	calm: require("@/assets/music/calm.m4a"),
	drift: require("@/assets/music/drift.m4a"),
	night: require("@/assets/music/night.m4a"),
};

/** Loops a track until the returned stop is called. */
export function playMusic(track: MusicTrack) {
	const player = createAudioPlayer(TRACKS[track]);
	player.loop = true;
	player.volume = MUSIC_VOLUME;
	player.play();
	// remove() alone leaves it playing.
	return () => {
		player.pause();
		player.remove();
	};
}
