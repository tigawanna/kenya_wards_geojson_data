import { insertWards } from "./wards/insert-wards.js";
import { insertCountry } from "./country/insert-country.js";
import { initDb } from "./lib/client.js";
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join } from "path";

function createTriggers(db: Database.Database) {
  // Read the SQL file with triggers
  const triggersSqlPath = join(process.cwd(), "src/sqlite-spatialite/create-triggers.sql");
  const triggersSql = readFileSync(triggersSqlPath, "utf8");
  
  // Execute the triggers SQL
  db.exec(triggersSql);
  console.log("✓ Triggers created successfully");
}

async function main() {
  await insertCountry();
  await insertWards();
  
  // Create triggers after inserting data
  const { db } = initDb();
  try {
    createTriggers(db);
  } catch (error) {
    console.error("Error creating triggers:", error);
  } finally {
    db.close();
  }
}

main().catch(console.error)
