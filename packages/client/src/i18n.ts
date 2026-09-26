import i18next, { type Module } from "i18next";

import { ApiError } from "./api.ts";
import { en } from "./locales/en.ts";

declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: "translation";
		resources: { translation: typeof en };
	}
}

const NOT_FOUND = 404;
/** Add a language here with its `locales/<code>.ts`, shaped like `en`. */
const resources = { en: { translation: en } };

/**
 * Starts i18next in the first of the device's languages (BCP 47 tags, best
 * first) that we have, else English. Apps pass react-i18next's plugin and call
 * this once before the first render; resources are bundled, so it's synchronous.
 */
export function startI18n(languages: readonly string[], react: Module) {
	void i18next.use(react).init({
		resources,
		lng: languages
			.map((tag) => tag.split("-")[0])
			.find((l) => l && l in resources),
		fallbackLng: "en",
		// React already escapes what it renders.
		interpolation: { escapeValue: false },
		initAsync: false,
	});
}

/** What to show when a room can't be opened: a wrong code, or anything else. */
export const roomErrorText = (error: unknown) =>
	error instanceof ApiError && error.status === NOT_FOUND
		? i18next.t("room.notFound")
		: i18next.t("room.openFailed");
