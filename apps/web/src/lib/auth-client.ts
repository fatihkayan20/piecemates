import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ENV } from "../env.public";

export const authClient = createAuthClient({
  baseURL: ENV.VITE_SERVER_URL,
  plugins: [anonymousClient()],
});

/** Every player gets a user id; guests are signed in silently. */
export async function ensureSession() {
  const { data } = await authClient.getSession();
  if (!data) await authClient.signIn.anonymous();
}
