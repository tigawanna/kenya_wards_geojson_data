import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDb } from '@/sqlite-spatialite/lib/client.js';
import Database from 'better-sqlite3';
import { TEST_DB_PATH } from '@tests/constants.js';

describe('SQLite Triggers', () => {
  let db: Database.Database;

  beforeAll(() => {
    const dbResult = initDb(TEST_DB_PATH);
    db = dbResult.db;
  });

  afterAll(() => {
    db.close();
  });

  it('should have ward triggers registered', () => {
    const triggers = db.prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE '%ward%'").all();
    
    expect(triggers.length).toBeGreaterThan(0);
    expect(triggers.some((t: any) => t.name.includes('ward'))).toBe(true);
  });

  it('should fire INSERT trigger when ward is added', () => {
    // Get initial event count
    const initialCount = db.prepare("SELECT COUNT(*) as count FROM kenya_ward_events").get() as { count: number };
    
    // Insert test ward
    db.prepare(`
      INSERT INTO kenya_wards (ward_code, ward, county, county_code, constituency, constituency_code, geom)
      VALUES (?, ?, ?, ?, ?, ?, GeomFromText(?, 4326))
    `).run('TEST001', 'Test Ward', 'Test County', 999, 'Test Constituency', 9999, 'POINT(36.817223 -1.286389)');
    
    // Check event was created
    const afterCount = db.prepare("SELECT COUNT(*) as count FROM kenya_ward_events").get() as { count: number };
    expect(afterCount.count).toBe(initialCount.count + 1);
    
    // Cleanup
    db.prepare("DELETE FROM kenya_wards WHERE ward_code = ?").run('TEST001');
    db.prepare("DELETE FROM kenya_ward_events WHERE ward_code = ?").run('TEST001');
  });
});
