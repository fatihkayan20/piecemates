import { useEffect } from "react";

import { playMusic } from "@/lib/music";

import { useSettings } from "./use-settings";

/** Plays my chosen track while mounted (inside a room). */
export function useMusic() {
	const music = useSettings((s) => s.music);
	useEffect(() => (music ? playMusic(music) : undefined), [music]);
}
