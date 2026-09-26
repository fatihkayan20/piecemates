import {
	analyticsKey,
	DATA_COLLECTION,
	sentryOptions,
	setTrackSink,
	stampEvents,
} from "@piecemates/telemetry";
import * as Sentry from "@sentry/react";
import type { AnyRouter } from "@tanstack/react-router";
import posthog from "posthog-js";

import { version } from "../../package.json";
import { ENV } from "../env.public";

/** Starts Sentry, and PostHog in production; each stays off without its key. */
export function startTelemetry(router: AnyRouter) {
	const environment = import.meta.env.MODE;
	Sentry.init({
		...sentryOptions(ENV.VITE_SENTRY_DSN, environment),
		dataCollection: DATA_COLLECTION,
		integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
		// The API is on another origin, so traces only carry on there if listed.
		tracePropagationTargets: [ENV.VITE_SERVER_URL],
	});
	const key = analyticsKey(ENV.VITE_POSTHOG_KEY, environment);
	if (!key) return;
	posthog.init(key, {
		api_host: ENV.VITE_POSTHOG_HOST,
		disable_session_recording: true,
		person_profiles: "identified_only",
		before_send: stampEvents("web", version, environment),
	});
	setTrackSink((event, props) => posthog.capture(event, props));
}
