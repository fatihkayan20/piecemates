import { expoClient } from "@better-auth/expo/client";
import { createEnsureSession } from "@piecemates/client";
import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

import { ENV } from "../src/env";

// app.json sets one scheme; Expo's type also allows a list.
const scheme = [Constants.expoConfig?.scheme].flat()[0] ?? "puzzle";

export const authClient = createAuthClient({
	baseURL: ENV.EXPO_PUBLIC_SERVER_URL,
	plugins: [
		anonymousClient(),
		expoClient({
			scheme,
			storagePrefix: scheme,
			storage: SecureStore,
		}),
	],
});

export const ensureSession = createEnsureSession(authClient);
