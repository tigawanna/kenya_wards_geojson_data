import type { Database as BetterSqliteType } from "better-sqlite3";
import { WARDS_GEOJSON } from "@/data/wards_geojson.js";
import type Database from "better-sqlite3";


// Tolerance: 0.0005° ≈ 55m at equator — adjust if needed
const SIMPLIFY_TOLERANCE = 0.0005;

function createWardsTable(db: BetterSqliteType): void {
  // Drop table if it exists to ensure clean setup
  db.exec(`DROP TABLE IF EXISTS kenya_wards`);

  // Create table with bbox columns for fast map zoom
  db.exec(`
    CREATE TABLE kenya_wards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ward_code TEXT,
      ward TEXT NOT NULL,
      county TEXT NOT NULL,
      county_code INTEGER,
      sub_county TEXT,
      constituency TEXT NOT NULL,
      constituency_code INTEGER,
      minx REAL,  -- ← bounding box
      miny REAL,
      maxx REAL,
      maxy REAL,
      geom BLOB   -- ← WKB geometry (WGS84)
    );
  `);

  // Add geometry column using Spatialite function
  try {
    db.exec("SELECT AddGeometryColumn('kenya_wards', 'geom', 4326, 'MULTIPOLYGON', 'XY');");
    console.log("✅ Geometry column added (WGS84, MULTIPOLYGON).");
  } catch (e: any) {
    if (!e.message.includes("already exists") && !e.message.includes("duplicate column name")) {
      throw e;
    }
    console.log("ℹ️ Geometry column already exists.");
  }

  // Create spatial index
  try {
    db.exec(`SELECT CreateSpatialIndex('kenya_wards', 'geom');`);
    console.log("✅ Spatial index created.");
  } catch (e: any) {
    if (!e.message.includes("already defined") && !e.message.includes("isn't a Geometry column")) {
      throw e;
    }
    console.log("ℹ️ Spatial index already exists.");
  }
}

function insertWardsData(db: BetterSqliteType): void {
  // ✅ TWEAK: Wrap in ST_MakeValid to auto-fix invalid geoms
  const insert = db.prepare(`
    INSERT INTO kenya_wards (
      ward_code, ward, county, county_code, sub_county,
      constituency, constituency_code, geom
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ST_MakeValid(GeomFromGeoJSON(?)))
  `);

  const updateBbox = db.prepare(`
    UPDATE kenya_wards
    SET
      minx = MbrMinX(geom),
      miny = MbrMinY(geom),
      maxx = MbrMaxX(geom),
      maxy = MbrMaxY(geom)
    WHERE rowid = last_insert_rowid()
  `);

  // Wrap in transaction for max speed
  const transaction = db.transaction((features: any[]) => {
    for (const feature of features) {
      try {
        insert.run(
          feature.properties.wardcode,
          feature.properties.ward,
          feature.properties.county,
          feature.properties.countycode,
          feature.properties.sub_county || null,
          feature.properties.const,
          feature.properties.constcode,
          JSON.stringify(feature.geometry)
        );
        updateBbox.run(); // populate bbox immediately
      } catch (error) {
        console.error(`❌ Failed to insert ward: ${feature.properties.ward}`, error);
        throw error; // aborts transaction
      }
    }
  });

  console.log(`⏳ Inserting ${WARDS_GEOJSON.features.length} wards...`);
  transaction(WARDS_GEOJSON.features);
  console.log(`✅ Inserted ${WARDS_GEOJSON.features.length} wards.`);
}

function createWardEventsTable(db: BetterSqliteType): void {
  // Create the events table to log changes to wards
  db.exec(`
    CREATE TABLE IF NOT EXISTS kenya_ward_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL CHECK (event_type IN ('INSERT', 'UPDATE', 'DELETE')),
      ward_id INTEGER,
      ward_code TEXT,
      old_data TEXT, -- JSON of previous row data (NULL for INSERT)
      new_data TEXT, -- JSON of new row data (NULL for DELETE)
      timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sync_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (sync_status IN ('PENDING', 'SYNCED', 'FAILED')),
      sync_attempts INTEGER NOT NULL DEFAULT 0,
      last_sync_attempt TEXT,
      error_message TEXT,
      client_id TEXT
    );
  `);

  console.log("✅ Events table created.");
}

function finalizeDb(db: BetterSqliteType): void {
  console.log("🔧 Optimizing database (VACUUM + ANALYZE)...");
  db.exec("VACUUM;");
  db.exec("ANALYZE;");
  console.log("✅ Database optimized.");

  // Create the events table before finalizing
  createWardEventsTable(db);

  // Set schema version for future migrations
  db.exec(`
    CREATE TABLE IF NOT EXISTS _meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  db.prepare("INSERT OR REPLACE INTO _meta (key, value) VALUES (?, ?)").run(
    "schema_version",
    "1.0"
  );
  db.prepare("INSERT OR REPLACE INTO _meta (key, value) VALUES (?, ?)").run(
    "wards_count",
    WARDS_GEOJSON.features.length.toString()
  );

  console.log("✅ Schema version recorded.");
}

export async function createAndInsertWards(db:Database.Database) {
  // Use a separate optimized database file
  // const { db } = initDb();

  try {
    createWardsTable(db);
    const count = db.prepare("SELECT COUNT(*) as count FROM kenya_wards").get() as {
      count: number;
    };

    if (count.count === 0) {
      insertWardsData(db);
      finalizeDb(db);
    } else {
      console.log(`ℹ️ Ward data already exists (${count.count} records). Skipping.`);
    }
  } catch (error) {
    console.error("💥 Fatal error during database setup:", error);
    throw error; // Re-throw the error so callers know setup failed
  }
  // Don't close the DB connection here as the caller will manage it
  console.log("🎉 Kenya Wards Database Setup Complete — Optimized for Mobile!");
}

// main().catch(console.error);
