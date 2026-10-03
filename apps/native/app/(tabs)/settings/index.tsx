import { Button, Form, Section, Toggle } from "@expo/ui/swift-ui";
import { tint } from "@expo/ui/swift-ui/modifiers";
import { privacyUrl } from "@piecemates/client";
import { openBrowserAsync } from "expo-web-browser";
import { useThemeColor } from "heroui-native";
import { useTranslation } from "react-i18next";

import { AppHost } from "@/components/app-host";
import { AccountSection } from "@/components/settings/account-section";
import { MusicPicker } from "@/components/settings/music-picker";
import { SettingsControls } from "@/components/settings/settings-controls";
import { useAppTheme } from "@/contexts/app-theme-context";
import { ENV } from "@/src/env";

/** My settings for this device; the room's sheet shows the same controls. */
export default function Settings() {
	const { t } = useTranslation();
	const { isLight, toggleTheme } = useAppTheme();
	const foreground = useThemeColor("foreground");
	return (
		<AppHost style={{ flex: 1 }}>
			<Form>
				<AccountSection />
				<Section title={t("settings.board")}>
					<SettingsControls />
					<MusicPicker />
				</Section>
				<Section title={t("settings.appearance")}>
					<Toggle
						label={t("settings.darkMode")}
						isOn={!isLight}
						onIsOnChange={toggleTheme}
					/>
				</Section>
				<Section title={t("settings.about")}>
					<Button
						label={t("settings.privacyPolicy")}
						onPress={() =>
							openBrowserAsync(privacyUrl(ENV.EXPO_PUBLIC_WEB_URL))
						}
						modifiers={[tint(foreground)]}
					/>
				</Section>
			</Form>
		</AppHost>
	);
}
