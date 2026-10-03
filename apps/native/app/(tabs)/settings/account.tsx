import { Form, Image, Section, Text, VStack } from "@expo/ui/swift-ui";
import {
	font,
	foregroundStyle,
	frame,
	multilineTextAlignment,
} from "@expo/ui/swift-ui/modifiers";
import { Redirect, Stack } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { LinkAccountForm } from "@/components/account/link-account-form";
import { AppHost } from "@/components/app-host";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

const HERO = { iconSize: 44, spacing: 8, titleSize: 22 };

/** Link account: once the guest signs up or in, back to Settings with their rooms moved over. */
export default function Account() {
	const { t } = useTranslation();
	const foreground = useThemeColor("foreground");
	const { data: session } = authClient.useSession();
	const linked = session?.user.isAnonymous === false;
	useEffect(() => {
		if (linked) void api.queryClient.invalidateQueries();
	}, [linked]);
	if (linked) return <Redirect href="/settings" />;
	return (
		<AppHost style={{ flex: 1 }}>
			<Stack.Screen options={{ title: t("account.linkAccount") }} />
			<Form>
				<Section>
					<VStack
						spacing={HERO.spacing}
						modifiers={[frame({ maxWidth: Number.POSITIVE_INFINITY })]}
					>
						<Image
							systemName="person.crop.circle.badge.checkmark"
							size={HERO.iconSize}
							color={foreground}
						/>
						<Text
							modifiers={[font({ size: HERO.titleSize, weight: "semibold" })]}
						>
							{t("account.linkTitle")}
						</Text>
						<Text
							modifiers={[
								foregroundStyle("secondary"),
								multilineTextAlignment("center"),
							]}
						>
							{t("account.linkHint")}
						</Text>
					</VStack>
				</Section>
				<LinkAccountForm />
			</Form>
		</AppHost>
	);
}
