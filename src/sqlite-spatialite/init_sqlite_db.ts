import { createAndInsertWards } from "./wards/insert-wards.js";
import { createAndInsertCountry } from "./country/insert-country.js";
import { initDb } from "./lib/client.js";
import { createTriggers } from "./ward-events/create_ward_event_triggers.js";
import { createWardEventsTable } from "./ward-events/create_kenya_ward_events.js";
import type Database from "better-sqlite3";
import { createWardUpdatesTable } from "./ward-events/create_ward_updates.js";

export async function setupDb(db: Database.Database) {
  // Create triggers after inserting data
  try {
    console.log("\n ============ createing  database =========== \n\n");
    await createAndInsertCountry(db);
    await createAndInsertWards(db);
    await createWardUpdatesTable(db);
    await createWardEventsTable(db);
    await createTriggers(db);
  } catch (error) {
    console.error("\nError initializing the database:", error);
    throw error; // Re-throw the error so callers know setup failed
  }
  // Don't close the DB connection here as the caller will manage it
}

if (import.meta.url === `file://${process.argv[1]}`) {
  async () => {
    setupDb(initDb("geo_kenya.db", true).db);
  };
}

// Run the function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const { db } = initDb("geo_kenya.db", true);
    try {
      await setupDb(db);
    } catch (error) {
      console.error("Error in init sqlite table script:", error);
      process.exit(1);
    } finally {
      db.close();
    }
  })();
}
