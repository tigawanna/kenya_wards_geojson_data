import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { initDb } from "@/sqlite-spatialite/lib/client.js";
import { setupDb } from "@/sqlite-spatialite/init_sqlite_db.js";
import Database from "better-sqlite3";
import { TEST_DB_PATH } from "@tests/constants.js";

describe("Database Tables and Schema", { sequential: true }, () => {
  let db: Database.Database;

  beforeAll(async () => {
    const { db: testDb } = initDb(TEST_DB_PATH, true);
    await setupDb(testDb);
    const dbResult = initDb(TEST_DB_PATH);
    db = dbResult.db;
  });

  afterAll(() => {
    db.close();
  });

  it("should have all required tables", () => {
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'spatial_%' AND name NOT LIKE 'geometry_%'
    `).all() as { name: string }[];

    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain("kenya_wards");
    expect(tableNames).toContain("country");
    expect(tableNames).toContain("kenya_ward_events");
    expect(tableNames).toContain("kenya_ward_updates");
    expect(tableNames).toContain("_meta");
  });

  it("should have correct columns in kenya_wards table", () => {
    const columns = db.prepare("PRAGMA table_info(kenya_wards)").all() as any[];
    const columnNames = columns.map(c => c.name);

    expect(columnNames).toContain("id");
    expect(columnNames).toContain("ward_code");
    expect(columnNames).toContain("ward");
    expect(columnNames).toContain("county");
    expect(columnNames).toContain("county_code");
    expect(columnNames).toContain("sub_county");
    expect(columnNames).toContain("constituency");
    expect(columnNames).toContain("constituency_code");
    expect(columnNames).toContain("minx");
    expect(columnNames).toContain("miny");
    expect(columnNames).toContain("maxx");
    expect(columnNames).toContain("maxy");
    expect(columnNames).toContain("geom");
  });

  it("should have correct columns in country table", () => {
    const columns = db.prepare("PRAGMA table_info(country)").all() as any[];
    const columnNames = columns.map(c => c.name);

    expect(columnNames).toContain("id");
    expect(columnNames).toContain("shape_name");
    expect(columnNames).toContain("shape_iso");
    expect(columnNames).toContain("shape_id");
    expect(columnNames).toContain("shape_group");
    expect(columnNames).toContain("shape_type");
    expect(columnNames).toContain("geom");
  });

  it("should have correct columns in kenya_ward_events table", () => {
    const columns = db.prepare("PRAGMA table_info(kenya_ward_events)").all() as any[];
    const columnNames = columns.map(c => c.name);
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("trigger_by");
    expect(columnNames).toContain("event_type");
    expect(columnNames).toContain("ward_id");
    expect(columnNames).toContain("ward_code");
    expect(columnNames).toContain("old_data");
    expect(columnNames).toContain("new_data");
    expect(columnNames).toContain("timestamp");
    expect(columnNames).toContain("sync_status");
    expect(columnNames).toContain("sync_attempts");
    expect(columnNames).toContain("last_sync_attempt");
    expect(columnNames).toContain("created_at");
    expect(columnNames).toContain("updated_at");
    expect(columnNames).toContain("error_message");
    expect(columnNames).toContain("client_id");
  });

  it("should have 1452 rows in kenya_wards table", () => {
    const result = db.prepare("SELECT COUNT(*) as count FROM kenya_wards").get() as { count: number };
    expect(result.count).toBe(1452);
  });

  it("should have 1 country table (Kenya)", () => {
    const result = db.prepare("SELECT COUNT(*) as count FROM country").get() as { count: number };
    expect(result.count).toBe(1);
  });

  it("should have empty kenya_ward_events table", () => {
    const result = db.prepare("SELECT COUNT(*) as count FROM kenya_ward_events").get() as { count: number };
    expect(result.count).toBe(0);
  });

  it("should have all ward triggers created", () => {
    const triggers = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='trigger' AND name LIKE '%ward%'
    `).all() as { name: string }[];

    const triggerNames = triggers.map(t => t.name);
    expect(triggerNames).toContain("ward_insert_trigger");
    expect(triggerNames).toContain("ward_update_trigger");
    expect(triggerNames).toContain("ward_delete_trigger");
    expect(triggerNames).toContain("update_ward_events_timestamp");
    expect(triggerNames).toContain("update_ward_updates_timestamp");
    expect(triggers.length).toBe(5);
  });

  it("should have correct columns in kenya_ward_updates table", () => {
    const columns = db.prepare("PRAGMA table_info(kenya_ward_updates)").all() as any[];
    const columnNames = columns.map(c => c.name);

    expect(columnNames).toContain("id");
    expect(columnNames).toContain("version");
    expect(columnNames).toContain("data");
    expect(columnNames).toContain("created_at");
    expect(columnNames).toContain("updated_at");
    expect(columnNames).toContain("created_by");
    expect(columnNames).toContain("description");
  });

  it("should have ward event indexes created", () => {
    const indexes = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND tbl_name='kenya_ward_events'
    `).all() as { name: string }[];

    const indexNames = indexes.map(i => i.name);
    expect(indexNames).toContain("idx_ward_events_sync_status");
    expect(indexNames).toContain("idx_ward_events_timestamp");
    expect(indexNames).toContain("idx_ward_events_ward_id");
    expect(indexNames).toContain("idx_ward_events_event_type");
  });

  it("should have kenya_ward_updates indexes created", () => {
    const indexes = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND tbl_name='kenya_ward_updates'
    `).all() as { name: string }[];

    const indexNames = indexes.map(i => i.name);
    expect(indexNames).toContain("idx_kenya_ward_updates_version");
    expect(indexNames).toContain("idx_kenya_ward_updates_created_at");
  });

  it("should have all triggers created", () => {
    const allTriggers = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='trigger'
    `).all() as { name: string }[];

    const triggerNames = allTriggers.map(t => t.name);
    expect(triggerNames).toContain("ward_insert_trigger");
    expect(triggerNames).toContain("ward_update_trigger");
    expect(triggerNames).toContain("ward_delete_trigger");
    expect(triggerNames).toContain("update_ward_events_timestamp");
    expect(triggerNames).toContain("update_ward_updates_timestamp");
    expect(allTriggers.length).toBe(5);
  });
});
