/** Share of traces kept. Every error is sent; lower this when traffic grows. */
export const TRACES_SAMPLE_RATE = 1;

/** Share of errors that come with a screen recording; no recording otherwise. */
export const REPLAY_ON_ERROR_RATE = 0.1;

const CLIENT_ERROR = 400;
const SERVER_ERROR = 500;

/** An API answer the user caused (wrong room code, signed out): not a bug. */
const isClientError = (error: unknown) =>
	typeof error === "object" &&
	error !== null &&
	"status" in error &&
	typeof error.status === "number" &&
	error.status >= CLIENT_ERROR &&
	error.status < SERVER_ERROR;

/** Sentry options every SDK shares; no DSN means Sentry stays off. */
export const sentryOptions = (
	dsn: string | undefined,
	environment: string,
) => ({
	dsn,
	enabled: Boolean(dsn),
	environment,
	tracesSampleRate: TRACES_SAMPLE_RATE,
	beforeSend: <E>(event: E, hint: { originalException?: unknown }) =>
		isClientError(hint.originalException) ? null : event,
});

/** Sentry v11 collects cookies, bodies and user info by default; keep them out. */
export const DATA_COLLECTION = {
	userInfo: false,
	cookies: false,
	httpBodies: [],
};

/** Headers the server must accept so a trace carries on from the client. */
export const TRACE_HEADERS = ["sentry-trace", "baggage"];
