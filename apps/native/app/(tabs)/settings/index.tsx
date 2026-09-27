import { Form, Section, Toggle } from "@expo/ui/swift-ui";
import { useTranslation } from "react-i18next";

import { AppHost } from "@/components/app-host";
import { SettingsControls } from "@/components/settings/settings-controls";
import { useAppTheme } from "@/contexts/app-theme-context";

/** My settings for this device; the room's sheet shows the same controls. */
export default function Settings() {
	const { t } = useTranslation();
	const { isLight, toggleTheme } = useAppTheme();
	return (
		<AppHost style={{ flex: 1 }}>
			<Form>
				<Section title={t("settings.board")}>
					<SettingsControls />
				</Section>
				<Section title={t("settings.appearance")}>
					<Toggle
						label={t("settings.darkMode")}
						isOn={!isLight}
						onIsOnChange={toggleTheme}
					/>
				</Section>
			</Form>
		</AppHost>
	);
}
