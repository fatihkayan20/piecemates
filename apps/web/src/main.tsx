import { loadSettings } from "@piecemates/client";
import { reactErrorHandler } from "@sentry/react";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import { Loader } from "./components/loader";
import { ensureSession } from "./lib/auth-client";
import { startTelemetry } from "./lib/telemetry";
import { routeTree } from "./routeTree.gen";

const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	scrollRestoration: true,
	defaultPendingComponent: () => <Loader />,
	context: {},
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const rootElement = document.getElementById("app");

if (!rootElement) {
	throw new Error("Root element not found");
}

// First, so the session request is already traced.
startTelemetry(router);
void ensureSession();
void loadSettings(localStorage);

if (!rootElement.innerHTML) {
	// Errors React catches (route error screens included) still reach Sentry.
	const root = ReactDOM.createRoot(rootElement, {
		onUncaughtError: reactErrorHandler(),
		onCaughtError: reactErrorHandler(),
		onRecoverableError: reactErrorHandler(),
	});
	root.render(<RouterProvider router={router} />);
}
