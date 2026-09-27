import { initReactI18next, useTranslation } from "react-i18next";
import "@/global.css";
import { loadSettings, startI18n } from "@piecemates/client";
import * as Sentry from "@sentry/react-native";
import { getLocales } from "expo-localization";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { useScreenTracking } from "@/hooks/use-screen-tracking";
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
	return (
		<Stack screenOptions={{}}>
			<Stack.Screen
				name="(tabs)"
				options={{ headerShown: false, title: t("nav.home") }}
			/>
			<Stack.Screen name="room/[code]" />
		</Stack>
	);
}

function Layout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<KeyboardProvider>
				<AppThemeProvider>
					<HeroUINativeProvider>
						<StackLayout />
					</HeroUINativeProvider>
				</AppThemeProvider>
			</KeyboardProvider>
		</GestureHandlerRootView>
	);
}

// Catches render errors and native crashes for Sentry.
export default Sentry.wrap(Layout);
