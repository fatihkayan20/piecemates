import { identify } from "@piecemates/telemetry";

type Signed = { data: { user: { id: string } } | null };
type AnonymousAuthClient = {
	getSession: () => Promise<Signed>;
	signIn: { anonymous: () => Promise<Signed> };
	signOut: () => Promise<unknown>;
	deleteUser: (body: {
		password: string;
	}) => Promise<{ error: { message?: string } | null }>;
};

/**
 * Every player gets a user id; guests are signed in silently. The returned
 * function is safe to await anywhere and only signs in once (retries after a failure).
 */
export function createEnsureSession(authClient: AnonymousAuthClient) {
	let ready: Promise<void> | undefined;
	return () => {
		ready ??= (async () => {
			const { data } = await authClient.getSession();
			const user =
				data?.user ?? (await authClient.signIn.anonymous()).data?.user;
			if (user) identify(user.id);
		})().catch((error) => {
			ready = undefined;
			throw error;
		});
		return ready;
	};
}

/** Signing out leaves me a fresh guest, since every player needs a user id. */
export async function signOutToGuest(authClient: AnonymousAuthClient) {
	await authClient.signOut();
	await startAsGuest(authClient);
}

/**
 * Deletes my account for good (the password confirms it's me) and leaves me
 * a fresh guest. Returns the server's message when it refuses.
 */
export async function deleteAccountToGuest(
	authClient: AnonymousAuthClient,
	password: string,
) {
	const { error } = await authClient.deleteUser({ password });
	if (error) return error.message ?? "";
	await startAsGuest(authClient);
	return null;
}

async function startAsGuest(authClient: AnonymousAuthClient) {
	const { data } = await authClient.signIn.anonymous();
	if (data) identify(data.user.id);
}
