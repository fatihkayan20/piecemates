import {
	analyticsKey,
	REPLAY_ON_ERROR_RATE,
	sentryOptions,
	setAnalytics,
	stampEvents,
} from "@piecemates/telemetry";
import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import PostHog from "posthog-react-native";
import { Platform } from "react-native";

import { ENV } from "../src/env";

let posthog: PostHog | undefined;

/** Records an Expo Router screen, e.g. "/room/[code]". */
export const trackScreen = (name: string) => posthog?.screen(name);

/** Starts Sentry, and PostHog in production; each stays off without its key. */
export function startTelemetry() {
	const environment = __DEV__ ? "development" : "production";
	Sentry.init({
		...sentryOptions(ENV.EXPO_PUBLIC_SENTRY_DSN, environment),
		// Traces carry on into the API, which is on its own host.
		tracePropagationTargets: [ENV.EXPO_PUBLIC_SERVER_URL],
		integrations: [Sentry.mobileReplayIntegration()],
		replaysSessionSampleRate: 0,
		replaysOnErrorSampleRate: REPLAY_ON_ERROR_RATE,
	});
	const key = analyticsKey(ENV.EXPO_PUBLIC_POSTHOG_KEY, environment);
	if (!key) return;
	const client = new PostHog(key, {
		host: ENV.EXPO_PUBLIC_POSTHOG_HOST,
		before_send: stampEvents(
			Platform.OS === "android" ? "android" : "ios",
			Constants.expoConfig?.version ?? "unknown",
			environment,
		),
	});
	posthog = client;
	setAnalytics({
		capture: (event, props) => client.capture(event, props),
		identify: (userId) => client.identify(userId),
	});
}
