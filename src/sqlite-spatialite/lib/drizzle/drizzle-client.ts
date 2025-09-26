import { drizzle } from "drizzle-orm/better-sqlite3";
import { initDb } from "../client.js";
import * as schema from "./schema.js";

const { db: sqlite } = initDb();
export const drizzleDB = drizzle({ client: sqlite,schema });
