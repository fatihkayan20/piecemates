/**
 * Settings shared by every app's Sentry and PostHog setup. The SDKs themselves
 * are set up in each app, because Expo only links native modules the app lists.
 */

/** Tags every PostHog event, since the PostHog project is shared with another app. */
export const APP = "piecemates";

/** Share of traces kept. Errors are always sent. */
export const TRACES_SAMPLE_RATE = 0.1;

export type Platform = "web" | "ios" | "android" | "server";

/** Sentry options every SDK shares; no DSN means Sentry stays off. */
export const sentryOptions = (
	dsn: string | undefined,
	environment: string,
) => ({
	dsn,
	enabled: Boolean(dsn),
	environment,
	tracesSampleRate: TRACES_SAMPLE_RATE,
});

/** Sentry v11 collects cookies, bodies and user info by default; keep them out. */
export const DATA_COLLECTION = {
	userInfo: false,
	cookies: false,
	httpBodies: [],
};

/** PostHog only counts production, so testing never skews the numbers. */
export const analyticsKey = (key: string | undefined, environment: string) =>
	environment === "production" ? key : undefined;

/** Headers the server must accept so a trace carries on from the client. */
export const TRACE_HEADERS = ["sentry-trace", "baggage"];

type Captured = { properties?: Record<string, unknown> } | null;

/**
 * PostHog's `before_send`: stamps every event, the first pageview included,
 * with the app, platform, version and environment.
 */
export const stampEvents =
	(platform: Platform, version: string, environment: string) =>
	<E extends Captured>(event: E): E =>
		event && {
			...event,
			properties: {
				...event.properties,
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
	puzzle_solved: { pieces: number };
};

type Sink = (event: string, props: Record<string, number>) => void;
let sink: Sink = () => {};

/** Each app plugs its PostHog client in once at startup. */
export const setTrackSink = (next: Sink) => {
	sink = next;
};

export const track = <E extends keyof Events>(event: E, props: Events[E]) =>
	sink(event, props);
