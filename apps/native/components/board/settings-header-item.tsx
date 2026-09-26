import { Stack } from "expo-router";
import { useState } from "react";

import { SettingsSheet } from "./settings-sheet";

/** Adds the settings gear to the screen's header and opens the sheet from it. */
export function SettingsHeaderItem() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Stack.Screen
				options={{
					// TODO(android): unstable_headerRightItems is iOS only; add a headerRight gear for Android.
					unstable_headerRightItems: () => [
						{
							type: "button",
							label: "Settings",
							icon: { type: "sfSymbol", name: "gearshape" },
							onPress: () => setOpen(true),
						},
					],
				}}
			/>
			{open && <SettingsSheet onClose={() => setOpen(false)} />}
		</>
	);
}
