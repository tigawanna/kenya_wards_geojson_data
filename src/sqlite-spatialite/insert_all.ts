import { createAndInsertWards } from "./wards/insert-wards.js";
import { createAndInsertCountry } from "./country/insert-country.js";
import { initDb } from "./lib/client.js";
import { createTriggers } from "./ward-events/create-triggers.js";
import { createWardEventsTable } from "./ward-events/create_kenya_ward_events.js";
import type Database from "better-sqlite3";

export async function setupDb(db: Database.Database) {
  // Create triggers after inserting data
  try {
    await createAndInsertCountry(db);
    await createAndInsertWards(db);
    await createWardEventsTable(db);
    await createTriggers(db);
  } catch (error) {
    console.error("\nError initializing the database:", error);
    throw error; // Re-throw the error so callers know setup failed
  }
  // Don't close the DB connection here as the caller will manage it
}

async function main() {
  setupDb(initDb("geo_kenya.db",true).db);
}
main().catch(console.error);
