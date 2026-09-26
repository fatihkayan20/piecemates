/**
 * Settings shared by every app's Sentry and PostHog setup. The SDKs themselves
 * are set up in each app, because Expo only links native modules the app lists.
 */
export * from "./analytics.ts";
export * from "./sentry.ts";

export type Platform = "web" | "ios" | "android" | "server";
