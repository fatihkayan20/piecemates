/** Shortest password Better Auth accepts; the sign-up forms check it too. */
export const PASSWORD_MIN = 8;

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
