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
    // Create single ward_updates table with version number and data array
    db.exec(`
      CREATE TABLE IF NOT EXISTS ward_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER NOT NULL,
        data TEXT NOT NULL, -- JSON array of ward update objects
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        created_by TEXT,
        description TEXT
      );
    `);

    console.log("✅ ward_updates table created successfully.");

    // Create indexes for better query performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ward_updates_version ON ward_updates(version);
      CREATE INDEX IF NOT EXISTS idx_ward_updates_created_at ON ward_updates(created_at);
    `);

    console.log("✅ Ward updates indexes created successfully.");

  } catch (error) {
    console.error("💥 Error creating ward updates table:", error);
    throw error;
  }
}
