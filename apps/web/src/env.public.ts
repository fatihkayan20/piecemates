// Alchemy validates deployment inputs with Varlock; Workers use native env bindings.
import type { PublicCoercedEnvSchema } from "./env";

const VITE_SERVER_URL = import.meta.env.VITE_SERVER_URL;
if (!VITE_SERVER_URL) throw new Error("VITE_SERVER_URL is not set");

export const ENV = {
	VITE_SERVER_URL,
	VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
	VITE_POSTHOG_KEY: import.meta.env.VITE_POSTHOG_KEY,
	VITE_POSTHOG_HOST: import.meta.env.VITE_POSTHOG_HOST,
} satisfies Pick<
	PublicCoercedEnvSchema,
	| "VITE_SERVER_URL"
	| "VITE_SENTRY_DSN"
	| "VITE_POSTHOG_KEY"
	| "VITE_POSTHOG_HOST"
>;
