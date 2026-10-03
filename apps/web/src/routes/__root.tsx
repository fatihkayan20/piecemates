import { PRIVACY_PATH } from "@piecemates/client";
import { Toaster } from "@piecemates/ui/components/sonner";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import i18next from "i18next";

import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

import "../index.css";

export type RouterAppContext = Record<string, never>;

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{
				title: i18next.t("app.name"),
			},
			{
				name: "description",
				content: i18next.t("app.description"),
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),
});

function RootComponent() {
	// The privacy policy is a plain page, also shown inside the app's browser.
	const plain = useLocation({ select: (l) => l.pathname === PRIVACY_PATH });
	return (
		<>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				disableTransitionOnChange
				storageKey="vite-ui-theme"
			>
				{plain ? (
					<Outlet />
				) : (
					<div className="grid h-svh grid-rows-[auto_1fr]">
						<Header />
						<Outlet />
					</div>
				)}
				<Toaster richColors />
			</ThemeProvider>
			<TanStackRouterDevtools position="bottom-left" />
		</>
	);
}
