import { deleteAccountToGuest } from "@piecemates/client";
import i18next from "i18next";
import { Alert } from "react-native";

import { api } from "./api";
import { authClient } from "./auth-client";

/**
 * Deletes my account after I confirm with my password (App Store rule:
 * accounts can be deleted in the app); I'm left a fresh guest.
 */
export function confirmDeleteAccount() {
	const t = i18next.t;
	// ponytail: Alert.prompt is iOS only, like askName; Android needs its own input.
	Alert.prompt(
		t("account.deleteTitle"),
		t("account.deleteHint"),
		[
			{ text: t("account.cancel"), style: "cancel" },
			{
				text: t("account.deleteConfirm"),
				style: "destructive",
				onPress: async (password = "") => {
					const refused = await deleteAccountToGuest(authClient, password);
					if (refused !== null) {
						Alert.alert(refused);
						return;
					}
					await api.queryClient.invalidateQueries();
					Alert.alert(t("account.deleted"));
				},
			},
		],
		"secure-text",
	);
}
