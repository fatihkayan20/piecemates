import {
	analyticsKey,
	sentryOptions,
	setTrackSink,
	stampEvents,
} from "@piecemates/telemetry";
import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import PostHog from "posthog-react-native";
import { Platform } from "react-native";

import { ENV } from "../src/env";

/** Starts Sentry, and PostHog in production; each stays off without its key. */
export function startTelemetry() {
	const environment = __DEV__ ? "development" : "production";
	Sentry.init({
		...sentryOptions(ENV.EXPO_PUBLIC_SENTRY_DSN, environment),
		// Traces carry on into the API, which is on its own host.
		tracePropagationTargets: [ENV.EXPO_PUBLIC_SERVER_URL],
	});
	const key = analyticsKey(ENV.EXPO_PUBLIC_POSTHOG_KEY, environment);
	if (!key) return;
	const posthog = new PostHog(key, {
		host: ENV.EXPO_PUBLIC_POSTHOG_HOST,
		before_send: stampEvents(
			Platform.OS === "android" ? "android" : "ios",
			Constants.expoConfig?.version ?? "unknown",
			environment,
		),
	});
	setTrackSink((event, props) => posthog.capture(event, props));
}
