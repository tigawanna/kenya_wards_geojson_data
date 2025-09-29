import Database from "better-sqlite3";
import type { Database as BetterSqliteType } from "better-sqlite3";
import path from "path";
import fs from "fs";

export function initDb(
  name?: string,
  tearDown?: boolean
): {
  db: BetterSqliteType;
} {
  const basedbPath = `src/data`;
  const dbPath = name ? basedbPath + "/" + name : basedbPath + "/geo_kenya.db";

  if (tearDown && fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  console.log("===================== =========================");
  console.log("==========  🔌 Connecting to database at =========== :: ", dbPath);
  console.log("===================== =======================\n");
  const db = new Database(dbPath);

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
