import {
	createJSONStorage,
	persist,
	type StateStorage,
} from "zustand/middleware";
import { createStore } from "zustand/vanilla";

/** Table colours to pick from; the first matches the `board` theme token. */
export const BACKGROUNDS = [
	"#1c1917",
	"#14532d",
	"#172554",
	"#451a03",
	"#475569",
	"#d6d3d1",
];

/** My own view options, kept on this device and never sent to the room. */
export type Settings = { background: string };

/** Set by loadSettings; persist needs a storage from the start, so it goes through this. */
let target: StateStorage | undefined;
const storage: StateStorage = {
	getItem: (key) => target?.getItem(key) ?? null,
	setItem: (key, value) => target?.setItem(key, value),
	removeItem: (key) => target?.removeItem(key),
};

export const settingsStore = createStore<Settings>()(
	persist(() => ({ background: BACKGROUNDS[0] ?? "" }), {
		name: "puzzle-settings",
		storage: createJSONStorage(() => storage),
		// Each app hands over its storage in loadSettings.
		skipHydration: true,
	}),
);

/** Reads saved settings from the platform's storage and saves changes there. */
export function loadSettings(platform: StateStorage) {
	target = platform;
	return settingsStore.persist.rehydrate();
}

export const setBackground = (background: string) =>
	settingsStore.setState({ background });
