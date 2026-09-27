import { Ionicons } from "@expo/vector-icons";
import { Drawer, type DrawerNavigationOptions } from "expo-router/drawer";
import { useThemeColor } from "heroui-native";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

import { ThemeToggle } from "@/components/theme-toggle";

function DrawerLayout() {
	const { t } = useTranslation();
	const themeColorForeground = useThemeColor("foreground");
	const themeColorBackground = useThemeColor("background");
	/** A drawer entry: its header title, label and icon. */
	const screen = (
		title: string,
		icon: ComponentProps<typeof Ionicons>["name"],
	): DrawerNavigationOptions => ({
		headerTitle: title,
		drawerLabel: ({ color, focused }) => (
			<Text style={{ color: focused ? color : themeColorForeground }}>
				{title}
			</Text>
		),
		drawerIcon: ({ size, color, focused }) => (
			<Ionicons
				name={icon}
				size={size}
				color={focused ? color : themeColorForeground}
			/>
		),
	});

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
				options={screen(t("nav.home"), "home-outline")}
			/>
			<Drawer.Screen
				name="history"
				options={screen(t("nav.history"), "time-outline")}
			/>
		</Drawer>
	);
}

export default DrawerLayout;
