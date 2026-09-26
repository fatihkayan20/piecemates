import { Stack } from "expo-router";
import { useState } from "react";

import { PlayersSheet } from "./players-sheet";
import { SettingsSheet } from "./settings-sheet";

type Sheet = "players" | "settings";

/** Players and settings in the screen's header, and the sheets they open. */
export function RoomHeaderItems({ code }: { code: string }) {
	const [sheet, setSheet] = useState<Sheet>();
	const close = () => setSheet(undefined);

	return (
		<>
			<Stack.Screen
				options={{
					// TODO(android): unstable_headerRightItems is iOS only; add headerRight buttons for Android.
					unstable_headerRightItems: () => [
						{
							type: "button",
							label: "Players",
							icon: { type: "sfSymbol", name: "person.2" },
							onPress: () => setSheet("players"),
						},
						{
							type: "button",
							label: "Settings",
							icon: { type: "sfSymbol", name: "gearshape" },
							onPress: () => setSheet("settings"),
						},
					],
				}}
			/>
			{sheet === "settings" && <SettingsSheet onClose={close} />}
			{sheet === "players" && <PlayersSheet code={code} onClose={close} />}
		</>
	);
}
