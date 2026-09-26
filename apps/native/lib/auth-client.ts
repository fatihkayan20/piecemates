import { expoClient } from "@better-auth/expo/client";
import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

import { ENV } from "../src/env";

export const authClient = createAuthClient({
  baseURL: ENV.EXPO_PUBLIC_SERVER_URL,
  plugins: [
    anonymousClient(),
    expoClient({
      scheme: Constants.expoConfig?.scheme as string,
      storagePrefix: Constants.expoConfig?.scheme as string,
      storage: SecureStore,
    }),
  ],
});

let ready: Promise<void> | undefined;

/** Every player gets a user id; guests are signed in silently. Safe to await anywhere. */
export function ensureSession() {
  ready ??= (async () => {
    const { data } = await authClient.getSession();
    if (!data) await authClient.signIn.anonymous();
  })();
  return ready;
}
