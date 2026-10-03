import i18next from "i18next";
import z from "zod";

/** Shortest password Better Auth accepts; the sign-up forms check it too. */
export const PASSWORD_MIN = 8;
/** Shortest account name the sign-up forms accept. */
export const NAME_MIN = 2;

/**
 * The account forms' rules, with messages in my language. Signing up also
 * needs a name and the password typed twice; signing in only checks the email.
 */
export function accountForm(signingUp: boolean) {
	const t = i18next.t;
	const fields = {
		email: z.email(t("account.invalidEmail")),
		password: z
			.string()
			.min(PASSWORD_MIN, t("account.passwordTooShort", { min: PASSWORD_MIN })),
	};
	if (!signingUp)
		return z.object({ ...fields, name: z.string(), confirm: z.string() });
	return z
		.object({
			...fields,
			name: z
				.string()
				.trim()
				.min(NAME_MIN, t("account.nameTooShort", { min: NAME_MIN })),
			confirm: z.string(),
		})
		.refine((form) => form.password === form.confirm, {
			message: t("account.passwordsDiffer"),
			path: ["confirm"],
		});
}

/** The first readable message in an auth or form error (a string, an Error-like object, or a list of them). */
export function getErrorMessage(error: unknown): string | null {
	if (!error) return null;

	if (typeof error === "string") {
		return error;
	}

	if (Array.isArray(error)) {
		for (const issue of error) {
			const message = getErrorMessage(issue);
			if (message) {
				return message;
			}
		}
		return null;
	}

	if (typeof error === "object" && error !== null && "message" in error) {
		if (typeof error.message === "string") {
			return error.message;
		}
	}

	return null;
}
