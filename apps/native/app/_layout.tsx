import { initReactI18next, useTranslation } from "react-i18next";
import "@/global.css";
import { loadSettings, startI18n } from "@piecemates/client";
import * as Sentry from "@sentry/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { getLocales } from "expo-localization";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { HeroUINativeProvider, useThemeColor } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppThemeProvider, useAppTheme } from "@/contexts/app-theme-context";
import { useScreenTracking } from "@/hooks/use-screen-tracking";
import { api } from "@/lib/api";
import { ensureSession } from "@/lib/auth-client";
import { startTelemetry } from "@/lib/telemetry";

// First, so the session request is already traced.
startTelemetry();
void ensureSession();
startI18n(
	getLocales().map((l) => l.languageTag),
	initReactI18next,
);
// ponytail: SecureStore is the storage we already ship; fine for a few prefs (2 KB per key).
void loadSettings({
	getItem: SecureStore.getItemAsync,
	setItem: SecureStore.setItemAsync,
	removeItem: SecureStore.deleteItemAsync,
});

export const unstable_settings = {
	initialRouteName: "(tabs)",
};

function StackLayout() {
	const { t } = useTranslation();
	useScreenTracking();
	const { isLight } = useAppTheme();
	const base = isLight ? DefaultTheme : DarkTheme;
	const background = useThemeColor("background");
	const foreground = useThemeColor("foreground");
	// Native headers, tab bars and their blurs follow this, not Uniwind.
	const theme = {
		...base,
		colors: { ...base.colors, background, card: background, text: foreground },
	};
	return (
		<ThemeProvider value={theme}>
			<Stack screenOptions={{}}>
				<Stack.Screen
					name="(tabs)"
					options={{ headerShown: false, title: t("nav.home") }}
				/>
				<Stack.Screen name="room/[code]" />
			</Stack>
		</ThemeProvider>
	);
}

function Layout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<QueryClientProvider client={api.queryClient}>
				<KeyboardProvider>
					<AppThemeProvider>
						<HeroUINativeProvider>
							<StackLayout />
						</HeroUINativeProvider>
					</AppThemeProvider>
				</KeyboardProvider>
			</QueryClientProvider>
		</GestureHandlerRootView>
	);
}

// Catches render errors and native crashes for Sentry.
export default Sentry.wrap(Layout);
