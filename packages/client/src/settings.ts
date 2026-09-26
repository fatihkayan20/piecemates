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
] as const;

export type Background = (typeof BACKGROUNDS)[number];

/** The theme the board's controls use on each table colour, so they stay readable. */
export const BOARD_SCHEMES: Record<Background, "light" | "dark"> = {
	"#1c1917": "dark",
	"#14532d": "dark",
	"#172554": "dark",
	"#451a03": "dark",
	"#475569": "dark",
	"#d6d3d1": "light",
};

/** My own view options, kept on this device and never sent to the room. */
export type Settings = {
	background: Background;
	sounds: boolean;
	haptics: boolean;
};

/** Set by loadSettings; persist needs a storage from the start, so it goes through this. */
let target: StateStorage | undefined;
const storage: StateStorage = {
	getItem: (key) => target?.getItem(key) ?? null,
	setItem: (key, value) => target?.setItem(key, value),
	removeItem: (key) => target?.removeItem(key),
};

export const settingsStore = createStore<Settings>()(
	persist(
		(): Settings => ({
			background: BACKGROUNDS[0] ?? "",
			sounds: true,
			haptics: true,
		}),
		{
			name: "puzzle-settings",
			storage: createJSONStorage(() => storage),
			// Each app hands over its storage in loadSettings.
			skipHydration: true,
		},
	),
);

/** Reads saved settings from the platform's storage and saves changes there. */
export function loadSettings(platform: StateStorage) {
	target = platform;
	return settingsStore.persist.rehydrate();
}

/** Picks a table colour; anything outside `BACKGROUNDS` is ignored. */
export function setBackground(color: string) {
  const background = BACKGROUNDS.find((b) => b === color);
  if (background) settingsStore.setState({ background });
}
export const setSounds = (sounds: boolean) =>
	settingsStore.setState({ sounds });
export const setHaptics = (haptics: boolean) =>
	settingsStore.setState({ haptics });
