import type Database from "better-sqlite3";

export async function createWardEventsTable(db: Database.Database) {
  //   const { db } = initDb();

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS kenya_ward_events (
        id TEXT PRIMARY KEY,
        trigger_by TEXT CHECK(trigger_by IN ('REPLAY', 'TRIGGER')),
        event_type TEXT NOT NULL CHECK(event_type IN ('INSERT', 'UPDATE', 'DELETE')),
        ward_id INTEGER,
        ward_code TEXT,
        old_data TEXT,
        new_data TEXT,
        timestamp TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        sync_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(sync_status IN ('PENDING', 'SYNCED', 'FAILED')),
        sync_attempts INTEGER NOT NULL DEFAULT 0,
        last_sync_attempt TEXT,
        error_message TEXT,
        client_id TEXT
      );
    `);

    console.log("✅ kenya_ward_events table created successfully.");

    // Create indexes for better query performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ward_events_sync_status ON kenya_ward_events(sync_status);
      CREATE INDEX IF NOT EXISTS idx_ward_events_timestamp ON kenya_ward_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_ward_events_ward_id ON kenya_ward_events(ward_id);
      CREATE INDEX IF NOT EXISTS idx_ward_events_event_type ON kenya_ward_events(event_type);
    `);

    console.log("✅ Indexes created successfully.");
  } catch (error) {
    console.error("💥 Error creating ward events table:", error);
    throw error;
  }
  // Don't close the DB connection here as the caller will manage it
}

