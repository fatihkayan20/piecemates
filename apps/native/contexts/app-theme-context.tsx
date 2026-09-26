import * as SecureStore from "expo-secure-store";
import { createContext, type ReactNode, useContext } from "react";
import { Uniwind, useUniwind } from "uniwind";

type ThemeName = "light" | "dark";

// Uniwind forgets a picked theme on restart, so it's saved on the device.
const THEME_KEY = "puzzle-theme";
void SecureStore.getItemAsync(THEME_KEY).then((saved) => {
	if (saved === "light" || saved === "dark") Uniwind.setTheme(saved);
});
const saveTheme = (theme: ThemeName) => {
	Uniwind.setTheme(theme);
	void SecureStore.setItemAsync(THEME_KEY, theme);
};

type AppThemeContextType = {
	currentTheme: string;
	isLight: boolean;
	isDark: boolean;
	setTheme: (theme: ThemeName) => void;
	toggleTheme: () => void;
};

const AppThemeContext = createContext<AppThemeContextType | undefined>(
	undefined,
);

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
	const { theme } = useUniwind();
	const value = {
		currentTheme: theme,
		isLight: theme === "light",
		isDark: theme === "dark",
		setTheme: saveTheme,
		toggleTheme: () => saveTheme(theme === "light" ? "dark" : "light"),
	};
	return (
		<AppThemeContext.Provider value={value}>
			{children}
		</AppThemeContext.Provider>
	);
};

export function useAppTheme() {
	const context = useContext(AppThemeContext);
	if (!context) {
		throw new Error("useAppTheme must be used within AppThemeProvider");
	}
	return context;
}
