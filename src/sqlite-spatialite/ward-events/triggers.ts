import { drizzleDB } from "@/sqlite-spatialite/lib/drizzle/drizzle-client.js";
import { initDb } from "../lib/client.js";

const { db } = initDb();

async function listTriggers() {
  const results = db.prepare("SELECT name FROM sqlite_master WHERE type='trigger'")
  .all();
  console.log("\n== registered triggers == ", results);
}

async function main() {
  listTriggers();
}

main().catch(console.error);
