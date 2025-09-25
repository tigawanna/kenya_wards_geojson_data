import { drizzle } from "drizzle-orm/better-sqlite3";
import { initDb } from "../client.js";
import * as schema from "./schema.js";
// import { drizzle } from "drizzle-orm/libsql";

const { db: dbInstance } = initDb();

export const drizzleDb = drizzle({ client: dbInstance, schema });
