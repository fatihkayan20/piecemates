type AnonymousAuthClient = {
	getSession: () => Promise<{ data: unknown }>;
	signIn: { anonymous: () => Promise<unknown> };
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
			if (!data) await authClient.signIn.anonymous();
		})().catch((error) => {
			ready = undefined;
			throw error;
		});
		return ready;
	};
}
