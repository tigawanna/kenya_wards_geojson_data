import type Database from "better-sqlite3";
import { z } from "zod";

// Zod schema for ward update data
export const WardUpdateDataSchema = z.object({
  id: z.number().int().positive(),
  data: z.record(z.string(), z.any()),
  event: z.enum(['create', 'update', 'delete'])
});

export const WardUpdatesSchema = z.object({
  id: z.number().int().positive().optional(),
  version: z.number().int().positive(),
  data: z.array(WardUpdateDataSchema),
  created_at: z.string().optional(),
  created_by: z.string().optional(),
  description: z.string().optional()
});



export interface WardUpdateData {
  id: number; // ward id
  data: Partial<Record<string, any>>; // partial object of updated row
  event: 'create' | 'update' | 'delete';
}

export interface WardUpdates {
  id: number;
  version: number;
  data: WardUpdateData[]; // array of ward updates
  created_at: string;
  created_by?: string;
  description?: string;
}

export async function createWardUpdatesTable(db: Database.Database) {
  try {
    // Create single kenya_ward_updates table with version number and data array
    db.exec(`
      CREATE TABLE IF NOT EXISTS kenya_ward_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER NOT NULL,
        data TEXT NOT NULL, -- JSON array of ward update objects
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        created_by TEXT,
        description TEXT
      );
    `);

    console.log("✅ kenya_ward_updates table created successfully.");

    // Create indexes for better query performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_kenya_ward_updates_version ON kenya_ward_updates(version);
      CREATE INDEX IF NOT EXISTS idx_kenya_ward_updates_created_at ON kenya_ward_updates(created_at);
    `);

    console.log("✅ Ward updates indexes created successfully.");

    // Create trigger to automatically update updated_at
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_ward_updates_timestamp
      AFTER UPDATE ON kenya_ward_updates
      FOR EACH ROW
      BEGIN
        UPDATE kenya_ward_updates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);

    console.log("✅ Ward updates timestamp trigger created successfully.");

  } catch (error) {
    console.error("💥 Error creating ward updates table:", error);
    throw error;
  }
}
