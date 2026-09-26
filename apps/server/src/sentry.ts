import { DATA_COLLECTION, sentryOptions } from "@piecemates/telemetry";

/** Sentry options for the Worker and the room, read from its bindings. */
export const sentryFor = (env: Env) => ({
	...sentryOptions(env.SENTRY_DSN || undefined, env.NODE_ENV),
	dataCollection: DATA_COLLECTION,
});
