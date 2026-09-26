import { identify } from "@piecemates/telemetry";

type Signed = { data: { user: { id: string } } | null };
type AnonymousAuthClient = {
	getSession: () => Promise<Signed>;
	signIn: { anonymous: () => Promise<Signed> };
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
