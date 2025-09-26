import type { Database as BetterSqliteType } from "better-sqlite3";
import { initDb } from "@/sqlite-spatialite/lib/client.js";
import { readFileSync } from "fs";
import { join } from "path";
import type Database from "better-sqlite3";

function createCountryTable(db: BetterSqliteType): void {
  db.exec(`DROP TABLE IF EXISTS country`);

  db.exec(`
    CREATE TABLE country (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shape_name TEXT NOT NULL,
      shape_iso TEXT NOT NULL,
      shape_id TEXT,
      shape_group TEXT,
      shape_type TEXT,
      geom BLOB
    );
  `);

  try {
    db.exec("SELECT AddGeometryColumn('country', 'geom', 4326, 'MULTIPOLYGON', 'XY');");
    console.log("✅ Country geometry column added.");
  } catch (e: any) {
    if (!e.message.includes("already exists")) {
      throw e;
    }
  }

  try {
    db.exec(`SELECT CreateSpatialIndex('country', 'geom');`);
    console.log("✅ Country spatial index created.");
  } catch (e: any) {
    if (!e.message.includes("already defined")) {
      throw e;
    }
  }
}

function insertCountryData(db: BetterSqliteType): void {
  const geojsonPath = join(process.cwd(), "src/data/kenya-borders.geojson");
  const geojsonData = JSON.parse(readFileSync(geojsonPath, "utf-8"));

  const insert = db.prepare(`
    INSERT INTO country (
      shape_name, shape_iso, shape_id, shape_group, shape_type, geom
    ) VALUES (?, ?, ?, ?, ?, ST_MakeValid(GeomFromGeoJSON(?)))
  `);

  const transaction = db.transaction((features: any[]) => {
    for (const feature of features) {
      insert.run(
        feature.properties.shapeName,
        feature.properties.shapeISO,
        feature.properties.shapeID,
        feature.properties.shapeGroup,
        feature.properties.shapeType,
        JSON.stringify(feature.geometry)
      );
    }
  });

  console.log(`⏳ Inserting ${geojsonData.features.length} country features...`);
  transaction(geojsonData.features);
  console.log(`✅ Inserted ${geojsonData.features.length} country features.`);
}

export async function createAndInsertCountry(db:Database.Database) {
  // const { db } = initDb();

  try {
    createCountryTable(db);

    const count = db.prepare("SELECT COUNT(*) as count FROM country").get() as {
      count: number;
    };

    if (count.count === 0) {
      insertCountryData(db);
    } else {
      console.log(`ℹ️ Country data already exists (${count.count} records).`);
    }
  } catch (error) {
    console.error("💥 Error:", error);
    throw error; // Re-throw the error so callers know setup failed
  }
  // Don't close the DB connection here as the caller will manage it
  console.log("🎉 Kenya Country Border Setup Complete!");
}

// main().catch(console.error);
