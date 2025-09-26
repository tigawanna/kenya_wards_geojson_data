import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDb } from '@/sqlite-spatialite/lib/client.js';
import { setupDb } from '@/sqlite-spatialite/insert_all.js';
import Database from 'better-sqlite3';
import { TEST_DB_PATH } from '@tests/constants.js';
import type { WardEventTypes } from '@tests/types.js';



describe('Ward Events Triggers', { sequential: true }, () => {
  let db: Database.Database;

  beforeAll(async () => {
    // const { db: testDb } = initDb(TEST_DB_PATH, true);
    // await setupDb(testDb);
    const dbResult = initDb(TEST_DB_PATH);
    db = dbResult.db;
  });

  afterAll(() => {
    db.close();
  });

  it('should fire INSERT trigger when ward is added', () => {
    // Insert test ward
    const insertResult = db.prepare(`
      INSERT INTO kenya_wards (ward_code, ward, county, constituency, county_code, constituency_code)
      VALUES ('TEST001', 'Test Ward', 'Test County', 'Test Constituency', 999, 999)
    `).run();

    // Check event was created
    const insertEvents = db
      .prepare(
        `
      SELECT * FROM kenya_ward_events WHERE event_type = 'INSERT' AND ward_id = ?
    `
      )
      .all(insertResult.lastInsertRowid) as WardEventTypes[];

    expect(insertEvents.length).toBe(1);
    expect(insertEvents[0]?.trigger_by).toBe('TRIGGER');
    expect(insertEvents[0]?.ward_code).toBe('TEST001');
    expect(insertEvents[0]?.old_data).toBeNull();
    expect(insertEvents[0]?.new_data).toBeTruthy();
  });

  it('should fire UPDATE trigger when ward is modified', () => {
    // Get existing ward
    const ward = db.prepare("SELECT id FROM kenya_wards WHERE ward_code = 'TEST001'").get() as { id: number };
    
    // Update ward
    db.prepare(`
      UPDATE kenya_wards 
      SET ward = 'Updated Test Ward' 
      WHERE id = ?
    `).run(ward.id);

    // Check event was created
    const updateEvents = db
      .prepare(
        `
      SELECT * FROM kenya_ward_events WHERE event_type = 'UPDATE' AND ward_id = ?
    `
      )
      .all(ward.id) as WardEventTypes[];

    expect(updateEvents.length).toBe(1);
    expect(updateEvents[0]?.trigger_by).toBe('TRIGGER');
    expect(updateEvents[0]?.old_data).toBeTruthy();
    expect(updateEvents[0]?.new_data).toBeTruthy();
  });

  it('should fire DELETE trigger when ward is removed', () => {
    // Get existing ward
    const ward = db.prepare("SELECT id FROM kenya_wards WHERE ward_code = 'TEST001'").get() as { id: number };
    
    // Delete ward
    db.prepare("DELETE FROM kenya_wards WHERE id = ?").run(ward.id);

    // Check event was created
    const deleteEvents = db
      .prepare(
        `
      SELECT * FROM kenya_ward_events WHERE event_type = 'DELETE' AND ward_id = ?
    `
      )
      .all(ward.id) as WardEventTypes[];

    expect(deleteEvents.length).toBe(1);
    expect(deleteEvents[0]?.trigger_by).toBe('TRIGGER');
    expect(deleteEvents[0]?.old_data).toBeTruthy();
    expect(deleteEvents[0]?.new_data).toBeNull();
  });

  it('should have proper event data structure', () => {
    const events = db
      .prepare(
        `
      SELECT * FROM kenya_ward_events WHERE ward_code = 'TEST001' ORDER BY timestamp
    `
      )
      .all() as WardEventTypes[];

    expect(events.length).toBe(3); // INSERT, UPDATE, DELETE

    events.forEach(event => {
      expect(event.id).toBeTruthy();
      expect(event.trigger_by).toBe('TRIGGER');
      expect(['INSERT', 'UPDATE', 'DELETE']).toContain(event.event_type);
      expect(event.sync_status).toBe('PENDING');
      expect(event.sync_attempts).toBe(0);
    });
  });
});
