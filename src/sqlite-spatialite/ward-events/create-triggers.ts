import Database from "better-sqlite3";
import { initDb } from "../lib/client.js";

/**
 * Script to create triggers for the kenya_wards table
 * These triggers will automatically log events to kenya_ward_events table
 * whenever wards are inserted, updated, or deleted
 */

export async function createTriggers(db: Database.Database) {
  console.log("Creating triggers for kenya_wards table...");

  try {
    // Enable foreign keys
    db.pragma("foreign_keys = ON");

    // Create triggers
    console.log("Creating INSERT trigger...");
    db.prepare(
      `
      CREATE TRIGGER IF NOT EXISTS ward_insert_trigger
      AFTER INSERT ON kenya_wards
      FOR EACH ROW
      BEGIN
        INSERT INTO kenya_ward_events (
          id, trigger_by, event_type, ward_id, ward_code, old_data, new_data, timestamp, sync_status, sync_attempts
        ) VALUES (
          lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))),
          'TRIGGER',
          'INSERT',
          NEW.id,
          NEW.ward_code,
          NULL,
          json_object(
            'id', NEW.id,
            'ward_code', NEW.ward_code,
            'ward', NEW.ward,
            'county', NEW.county,
            'county_code', NEW.county_code,
            'sub_county', NEW.sub_county,
            'constituency', NEW.constituency,
            'constituency_code', NEW.constituency_code,
            'minx', NEW.minx,
            'miny', NEW.miny,
            'maxx', NEW.maxx,
            'maxy', NEW.maxy,
            'geom', AsGeoJSON(NEW.geom)
          ),
          CURRENT_TIMESTAMP,
          'PENDING',
          0
        );
      END;
    `
    ).run();

    console.log("Creating UPDATE trigger...");
    db.prepare(
      `
      CREATE TRIGGER IF NOT EXISTS ward_update_trigger
      AFTER UPDATE ON kenya_wards
      FOR EACH ROW
      BEGIN
        INSERT INTO kenya_ward_events (
          id, trigger_by, event_type, ward_id, ward_code, old_data, new_data, timestamp, sync_status, sync_attempts
        ) VALUES (
          lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))),
          'TRIGGER',
          'UPDATE',
          NEW.id,
          NEW.ward_code,
          json_object(
            'id', OLD.id,
            'ward_code', OLD.ward_code,
            'ward', OLD.ward,
            'county', OLD.county,
            'county_code', OLD.county_code,
            'sub_county', OLD.sub_county,
            'constituency', OLD.constituency,
            'constituency_code', OLD.constituency_code,
            'minx', OLD.minx,
            'miny', OLD.miny,
            'maxx', OLD.maxx,
            'maxy', OLD.maxy,
            'geom', AsGeoJSON(OLD.geom)
          ),
          json_object(
            'id', NEW.id,
            'ward_code', NEW.ward_code,
            'ward', NEW.ward,
            'county', NEW.county,
            'county_code', NEW.county_code,
            'sub_county', NEW.sub_county,
            'constituency', NEW.constituency,
            'constituency_code', NEW.constituency_code,
            'minx', NEW.minx,
            'miny', NEW.miny,
            'maxx', NEW.maxx,
            'maxy', NEW.maxy,
            'geom', AsGeoJSON(NEW.geom)
          ),
          CURRENT_TIMESTAMP,
          'PENDING',
          0
        );
      END;
    `
    ).run();

    console.log("Creating DELETE trigger...");
    db.prepare(
      `
      CREATE TRIGGER IF NOT EXISTS ward_delete_trigger
      AFTER DELETE ON kenya_wards
      FOR EACH ROW
      BEGIN
        INSERT INTO kenya_ward_events (
          id, trigger_by, event_type, ward_id, ward_code, old_data, new_data, timestamp, sync_status, sync_attempts
        ) VALUES (
          lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))),
          'TRIGGER',
          'DELETE',
          OLD.id,
          OLD.ward_code,
          json_object(
            'id', OLD.id,
            'ward_code', OLD.ward_code,
            'ward', OLD.ward,
            'county', OLD.county,
            'county_code', OLD.county_code,
            'sub_county', OLD.sub_county,
            'constituency', OLD.constituency,
            'constituency_code', OLD.constituency_code,
            'minx', OLD.minx,
            'miny', OLD.miny,
            'maxx', OLD.maxx,
            'maxy', OLD.maxy,
            'geom', AsGeoJSON(OLD.geom)
          ),
          NULL,
          CURRENT_TIMESTAMP,
          'PENDING',
          0
        );
      END;
    `
    ).run();

    console.log("✓ All triggers created successfully!");

    // Verify triggers exist
    const triggers = db
      .prepare(
        `
      SELECT name FROM sqlite_master 
      WHERE type='trigger' AND name LIKE '%ward%'
    `
      )
      .all();

    console.log("Triggers in database:");
    triggers.forEach((trigger: any) => {
      console.log(`  - ${trigger.name}`);
    });
  } catch (error) {
    console.error("Error creating triggers:", error);
    throw error;
  }
  // Don't close the DB connection here as the caller will manage it
}

// Run the function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const { db } = initDb();
    try {
      await createTriggers(db);
    } catch (error) {
      console.error("Error in createTriggers script:", error);
      process.exit(1);
    } finally {
      db.close();
    }
  })();
}
