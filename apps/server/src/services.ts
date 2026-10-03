import { createAuth as createConfiguredAuth } from "@piecemates/auth";
import { createDb } from "@piecemates/db";

import { beforeDeleteUser } from "./delete-user";
import { ENV } from "./env.server";

export const getDb = () => createDb(ENV);

let auth: ReturnType<typeof createConfiguredAuth> | undefined;
/** Better Auth, built once per isolate instead of on every request. */
export const getAuth = () => {
	auth ??= createConfiguredAuth(ENV, getDb(), beforeDeleteUser);
	return auth;
};
