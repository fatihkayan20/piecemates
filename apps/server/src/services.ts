import { createAuth as createConfiguredAuth } from "@piecemates/auth";
import { type Database, createDb } from "@piecemates/db";

import { ENV } from "./env.server";

export function getDb(): Database {
  return createDb(ENV);
}
export async function createAuth(database?: Database) {
  return createConfiguredAuth(ENV, database ?? (await getDb()));
}
