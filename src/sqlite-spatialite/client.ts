import Database from "better-sqlite3";
import type { Database as BetterSqliteType } from "better-sqlite3";

export function initDb(): {
  db: BetterSqliteType;
} {
  // Create a new database connection
  const db = new Database("data/kenya_wards.db", { verbose: console.log });

  // Load the SpatiaLite extension
  try {
    db.loadExtension("mod_spatialite");
    console.log("SpatiaLite extension loaded successfully.");
  } catch (error: any) {
    console.error("Error loading SpatiaLite extension:", error.message);
    console.error("Please make sure the mod_spatialite extension is installed and accessible.");
    process.exit(1);
  }

  // Initialize spatial metadata
  try {
    db.prepare("SELECT InitSpatialMetaData(1)").get();
    console.log("Spatial metadata initialized successfully.");
  } catch (error: any) {
    // Ignore the error if the metadata is already initialized
    if (!error.message.includes("already exists")) {
      console.error("Error initializing spatial metadata:", error.message);
      throw error;
    }
    console.log("Spatial metadata already initialized.");
  }

  return { db };
}
