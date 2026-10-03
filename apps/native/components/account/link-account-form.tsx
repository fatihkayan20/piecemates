import {
	Button,
	Picker,
	Section,
	SecureField,
	type SecureFieldRef,
	Text,
	TextField,
	type TextFieldRef,
} from "@expo/ui/swift-ui";
import {
	autocorrectionDisabled,
	controlSize,
	disabled,
	foregroundStyle,
	frame,
	keyboardType,
	listRowBackground,
	listRowInsets,
	onSubmit,
	pickerStyle,
	submitLabel,
	tag,
	textContentType,
	textInputAutocapitalization,
} from "@expo/ui/swift-ui/modifiers";
import { NAME_MIN, PASSWORD_MIN } from "@piecemates/client";
import { useThemeColor } from "heroui-native";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import z from "zod";

import { useSheetStyle } from "@/hooks/use-sheet-style";
import { authClient } from "@/lib/auth-client";

type Mode = "signUp" | "signIn";

const FULL = frame({ maxWidth: Number.POSITIVE_INFINITY });
/** The submit button fills its row, so it reads as a button, not a list row. */
const NO_INSETS = { top: 0, leading: 0, bottom: 0, trailing: 0 };

/** Create an account or sign in to one; either way the guest's rooms move to it. */
export function LinkAccountForm() {
	const { t } = useTranslation();
	const danger = useThemeColor("danger");
	const style = useSheetStyle();
	const [mode, setMode] = useState<Mode>("signUp");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string>();
	const [busy, setBusy] = useState(false);
	const signingUp = mode === "signUp";
	const emailRef = useRef<TextFieldRef>(null);
	const passwordRef = useRef<SecureFieldRef>(null);

	const submit = async () => {
		const parsed = z
			.object({
				name: signingUp
					? z
							.string()
							.trim()
							.min(NAME_MIN, t("account.nameTooShort", { min: NAME_MIN }))
					: z.string(),
				email: z.email(t("account.invalidEmail")),
				password: z
					.string()
					.min(
						PASSWORD_MIN,
						t("account.passwordTooShort", { min: PASSWORD_MIN }),
					),
			})
			.safeParse({ name, email: email.trim(), password });
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message);
			return;
		}
		setBusy(true);
		setError(undefined);
		const { data: fields } = parsed;
		const result = signingUp
			? await authClient.signUp.email(fields)
			: await authClient.signIn.email(fields);
		setBusy(false);
		if (result.error) setError(result.error.message ?? result.error.statusText);
	};

	return (
		<>
			<Section
				footer={
					error ? (
						<Text modifiers={[foregroundStyle(danger)]}>{error}</Text>
					) : undefined
				}
			>
				<Picker
					selection={mode}
					onSelectionChange={(next: Mode) => {
						setMode(next);
						setError(undefined);
					}}
					modifiers={[pickerStyle("segmented")]}
				>
					<Text modifiers={[tag("signUp")]}>{t("account.createAccount")}</Text>
					<Text modifiers={[tag("signIn")]}>{t("account.signIn")}</Text>
				</Picker>
				{signingUp && (
					<TextField
						placeholder={t("account.name")}
						onTextChange={setName}
						modifiers={[
							textContentType("name"),
							submitLabel("next"),
							onSubmit(() => void emailRef.current?.focus()),
						]}
					/>
				)}
				<TextField
					ref={emailRef}
					placeholder={t("account.email")}
					onTextChange={setEmail}
					modifiers={[
						keyboardType("email-address"),
						textContentType("emailAddress"),
						textInputAutocapitalization("never"),
						autocorrectionDisabled(),
						submitLabel("next"),
						onSubmit(() => void passwordRef.current?.focus()),
					]}
				/>
				<SecureField
					ref={passwordRef}
					placeholder={t("account.password")}
					onTextChange={setPassword}
					modifiers={[
						textContentType(signingUp ? "newPassword" : "password"),
						submitLabel("go"),
						onSubmit(submit),
					]}
				/>
			</Section>
			<Section>
				<Button
					onPress={submit}
					modifiers={[
						...style.prominent,
						controlSize("large"),
						listRowInsets(NO_INSETS),
						listRowBackground("clear"),
						disabled(busy),
					]}
				>
					<Text modifiers={[FULL]}>
						{busy
							? t("account.submitting")
							: signingUp
								? t("account.createAccount")
								: t("account.signIn")}
					</Text>
				</Button>
			</Section>
		</>
	);
}
