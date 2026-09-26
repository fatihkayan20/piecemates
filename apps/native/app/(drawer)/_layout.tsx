import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import { useThemeColor } from "heroui-native";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

import { ThemeToggle } from "@/components/theme-toggle";

function DrawerLayout() {
	const { t } = useTranslation();
	const themeColorForeground = useThemeColor("foreground");
	const themeColorBackground = useThemeColor("background");

	return (
		<Drawer
			screenOptions={{
				headerTintColor: themeColorForeground,
				headerStyle: { backgroundColor: themeColorBackground },
				headerTitleStyle: {
					fontWeight: "600",
					color: themeColorForeground,
				},
				headerRight: () => <ThemeToggle />,
				drawerStyle: { backgroundColor: themeColorBackground },
			}}
		>
			<Drawer.Screen
				name="index"
				options={{
					headerTitle: t("nav.home"),
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							{t("nav.home")}
						</Text>
					),
					drawerIcon: ({ size, color, focused }) => (
						<Ionicons
							name="home-outline"
							size={size}
							color={focused ? color : themeColorForeground}
						/>
					),
				}}
			/>
		</Drawer>
	);
}

export default DrawerLayout;
