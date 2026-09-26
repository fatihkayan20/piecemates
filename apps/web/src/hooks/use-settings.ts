import { type Settings, settingsStore } from "@piecemates/client";
import { useStore } from "zustand";

/** Reads my view settings. */
export const useSettings = <T>(select: (settings: Settings) => T) =>
	useStore(settingsStore, select);
