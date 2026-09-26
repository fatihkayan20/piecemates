import type { Platform } from "./index.ts";

/** Tags every PostHog event, since the PostHog project is shared with another app. */
export const APP = "piecemates";

/** PostHog only counts production, so testing never skews the numbers. */
export const analyticsKey = (key: string | undefined, environment: string) =>
	environment === "production" ? key : undefined;

// Room codes are the key to a room, so they stay out of analytics.
const ROOM_PATH = /\/room\/[A-Za-z0-9]+/g;
const hideRoomCode = (value: unknown) =>
	typeof value === "string" ? value.replace(ROOM_PATH, "/room/:code") : value;

type Captured = { properties?: Record<string, unknown> } | null;

/**
 * PostHog's `before_send`: stamps every event, the first pageview included,
 * with the app, platform, version and environment, and hides room codes in URLs.
 */
export const stampEvents =
	(platform: Platform, version: string, environment: string) =>
	<E extends Captured>(event: E): E =>
		event && {
			...event,
			properties: {
				...Object.fromEntries(
					Object.entries(event.properties ?? {}).map(([k, v]) => [
						k,
						hideRoomCode(v),
					]),
				),
				app: APP,
				platform,
				app_version: version,
				environment,
			},
		};

/** Every PostHog event and its properties, so web and native send the same names. */
export type Events = {
	room_created: { pieces: number };
	room_joined: { pieces: number };
	/** Seconds of play time, and players in the room at the time. */
	puzzle_solved: { pieces: number; seconds: number; players: number };
	/** Left before it was solved, with the share of pieces placed (0-100). */
	room_left: { pieces: number; placed_percent: number };
	room_shared: Record<string, never>;
	bag_created: Record<string, never>;
};

type Analytics = {
	capture: (event: string, props: Record<string, number>) => void;
	identify: (userId: string) => void;
};
let analytics: Analytics | undefined;

/** Each app plugs its PostHog client in once at startup. */
export const setAnalytics = (next: Analytics) => {
	analytics = next;
};

export const track = <E extends keyof Events>(event: E, props: Events[E]) =>
	analytics?.capture(event, props);

/** Ties events to the signed-in user, so one person on web and iOS counts once. */
export const identify = (userId: string) => analytics?.identify(userId);
