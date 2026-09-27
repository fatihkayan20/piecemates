import { MAX_OPEN_ROOMS, MIN_IMAGE_SIDE } from "@piecemates/game";
import { TRPCClientError } from "@trpc/client";
import i18next, { type Module } from "i18next";

import { en } from "./locales/en.ts";

declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: "translation";
		resources: { translation: typeof en };
	}
}

/** The API's error code, like NOT_FOUND, or CONFLICT when opening a room would put me over the cap. */
const errorCode = (error: unknown): string | undefined =>
	error instanceof TRPCClientError ? error.data?.code : undefined;
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

/** What to show when a room can't be opened: a wrong code, too many open, or anything else. */
export function roomErrorText(error: unknown) {
	if (errorCode(error) === "NOT_FOUND") return i18next.t("room.notFound");
	if (errorCode(error) === "CONFLICT")
		return i18next.t("home.openRoomsFull", { max: MAX_OPEN_ROOMS });
	return i18next.t("room.openFailed");
}

/** Upload errors the player can act on; the server and the client both use these messages. */
const UPLOAD_PROBLEMS = [
	"notAnImage",
	"imageTooSmall",
	"imageTooLarge",
	"uploadFailed",
	"useUploaded",
] as const;

/** What to show when a room can't be created: too many open, a photo we can't use, no uploads left, or anything else. */
export function createErrorText(error: unknown) {
	const code = errorCode(error);
	if (code === "CONFLICT")
		return i18next.t("home.openRoomsFull", { max: MAX_OPEN_ROOMS });
	if (code === "FORBIDDEN") return i18next.t("upload.noCredits");
	if (code === "TOO_MANY_REQUESTS") return i18next.t("upload.tooMany");
	const problem =
		error instanceof Error && UPLOAD_PROBLEMS.find((p) => p === error.message);
	return problem
		? i18next.t(`upload.${problem}`, { min: MIN_IMAGE_SIDE })
		: i18next.t("home.createFailed");
}
