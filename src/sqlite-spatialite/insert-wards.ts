import type { Database as BetterSqliteType } from "better-sqlite3";
import { initDb } from "./client.js";
import { WARDS_GEOJSON } from "@/data/wards_geojson.js";

function createWardsTable(): BetterSqliteType | null {
  try {
    const { db } = initDb();

    // First create the base table without geometry column
    db.exec(`
      CREATE TABLE IF NOT EXISTS kenya_wards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ward_code TEXT,
        ward TEXT NOT NULL,
        county TEXT NOT NULL,
        county_code INTEGER,
        sub_county TEXT,
        constituency TEXT NOT NULL,
        constituency_code INTEGER
      );
    `);

    // Add geometry column using Spatialite function
    try {
      db.exec("SELECT AddGeometryColumn('kenya_wards', 'geom', 4326, 'MULTIPOLYGON', 'XY');");
      console.log("Geometry column added successfully.");
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        throw error;
      }
      console.log("Geometry column already exists.");
    }

    // Check if spatial index exists
    const indexCheck = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'idx_kenya_wards_geom'`
      )
      .get();

    if (!indexCheck) {
      try {
        db.exec("SELECT CreateSpatialIndex('kenya_wards', 'geom');");
        console.log("Spatial index created successfully.");
      } catch (error) {
        console.error("Error creating spatial index:", error);
      }
    } else {
      console.log("Spatial index already exists.");
    }

    return db;
  } catch (error) {
    console.error("Error creating wards table:", error);
    return null;
  }
}

function insertWardsData(db: BetterSqliteType) {
  const insert = db.prepare(`
    INSERT INTO kenya_wards (
      ward_code, ward, county, county_code, sub_county, 
      constituency, constituency_code, geom
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, GeomFromGeoJSON(?, 4326))
  `);

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
      } catch (error) {
        console.error("Error inserting feature:", feature.properties.ward, error);
        throw error; // Re-throw to abort transaction
      }
    }
  });

  // Execute in transaction for better performance
  transaction(WARDS_GEOJSON.features);
  console.log(`Inserted ${WARDS_GEOJSON.features.length} wards successfully.`);
}

async function main() {
  const db = createWardsTable();
  if (!db) {
    console.error("Failed to create or access the database.");
    return;
  }

  try {
    const count = (
      db.prepare("SELECT COUNT(*) as count FROM kenya_wards").get() as { count: number }
    ).count;

    if (count === 0) {
      console.log("Inserting ward data...");
      insertWardsData(db);
      console.log("Ward data inserted successfully.");
    } else {
      console.log(`Ward data already exists (${count} records). Skipping insertion.`);
    }
  } catch (error) {
    console.error("Error during data operations:", error);
  } finally {
    db.close();
    console.log("Database connection closed.");
  }
}

main()
  .then(() => {
    console.log("Database setup complete.");
  })
  .catch((error) => {
    console.error("Error in main execution:", error);
  });
