import { Button, LabeledContent, Section, Text } from "@expo/ui/swift-ui";
import { tint } from "@expo/ui/swift-ui/modifiers";
import { signOutToGuest } from "@piecemates/client";
import { router } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { confirmDeleteAccount } from "@/lib/delete-account";

/** Who I am: a guest gets Link account, a signed-up player sees their email, Sign out and Delete account. */
export function AccountSection() {
	const { t } = useTranslation();
	const foreground = useThemeColor("foreground");
	const { data: session } = authClient.useSession();
	if (!session) return null;
	const { name, email, isAnonymous } = session.user;
	return (
		<Section
			title={t("account.title")}
			footer={isAnonymous ? <Text>{t("account.linkHint")}</Text> : undefined}
		>
			<LabeledContent label={name}>
				<Text>{isAnonymous ? t("account.guest") : email}</Text>
			</LabeledContent>
			{isAnonymous ? (
				<Button
					label={t("account.linkAccount")}
					onPress={() => router.push("/settings/account")}
					modifiers={[tint(foreground)]}
				/>
			) : (
				<>
					{/* biome-ignore lint/a11y/useValidAriaRole: SwiftUI's button role, not ARIA. */}
					<Button
						role="destructive"
						label={t("account.signOut")}
						onPress={async () => {
							await signOutToGuest(authClient);
							await api.queryClient.invalidateQueries();
						}}
					/>
					{/* biome-ignore lint/a11y/useValidAriaRole: SwiftUI's button role, not ARIA. */}
					<Button
						role="destructive"
						label={t("account.deleteAccount")}
						onPress={confirmDeleteAccount}
					/>
				</>
			)}
		</Section>
	);
}
