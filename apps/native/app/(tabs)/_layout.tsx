import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";

/** Home, History and Settings; a room opens over the tabs, without the bar. */
export default function TabsLayout() {
	const { t } = useTranslation();
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="(home)">
				<NativeTabs.Trigger.Label>{t("nav.home")}</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf={{ default: "house", selected: "house.fill" }}
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="history">
				<NativeTabs.Trigger.Label>{t("nav.history")}</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf={{ default: "clock", selected: "clock.fill" }}
				/>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="settings">
				<NativeTabs.Trigger.Label>{t("nav.settings")}</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					sf={{ default: "gearshape", selected: "gearshape.fill" }}
				/>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
