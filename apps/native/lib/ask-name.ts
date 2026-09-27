import { MAX_NAME_LENGTH, needsName } from "@piecemates/game";
import i18next from "i18next";
import { Alert } from "react-native";

import { authClient } from "./auth-client";

/**
 * Asks for my name before others see me (sharing or joining a room) and
 * saves it, then calls `onSaved`; `onCancel` when I back out.
 */
export function askName(onSaved: () => void, onCancel?: () => void) {
	const t = i18next.t;
	// ponytail: Alert.prompt is iOS only; Android needs its own input when it lands.
	Alert.prompt(t("name.title"), t("name.hint"), [
		{ text: t("room.close"), style: "cancel", onPress: onCancel },
		{
			text: t("name.save"),
			onPress: async (value = "") => {
				const name = value.trim();
				if (needsName(name) || name.length > MAX_NAME_LENGTH) {
					Alert.alert(t("name.invalid", { max: MAX_NAME_LENGTH }), "", [
						{
							text: t("room.close"),
							onPress: () => askName(onSaved, onCancel),
						},
					]);
					return;
				}
				const { error } = await authClient.updateUser({ name });
				if (error) Alert.alert(t("name.failed"));
				else onSaved();
			},
		},
	]);
}
