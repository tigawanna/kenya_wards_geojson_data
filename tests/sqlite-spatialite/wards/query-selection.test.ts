import { describe, it, expect, beforeAll } from 'vitest';
import { initDb } from '@/sqlite-spatialite/query-builder/client.js';
import {
  findWardById,
  findWardByCode,
  findWardsByName,
  findWardsByCountyPartial
} from '@/sqlite-spatialite/wards/query-wards.js';

describe('SQLite Spatialite Ward Selection Queries', () => {
  let db: any;

  beforeAll(async () => {
    const dbResult = await initDb();
    db = dbResult.db;
  });

  describe('findWardById', () => {
    it('should find a ward by its ID', () => {
      // Using a known ward ID (we'll first get one to test with)
      const sampleWard = db.prepare('SELECT id FROM kenya_wards LIMIT 1').get();
      expect(sampleWard).toBeDefined();
      expect(sampleWard.id).toBeDefined();
      
      const ward = findWardById(db, sampleWard.id);
      
      expect(ward).toBeDefined();
      expect(ward).not.toBeNull();
      if (ward) {
        expect(ward.id).toBe(sampleWard.id);
        expect(ward.ward).toBeDefined();
        expect(ward.county).toBeDefined();
        expect(ward.geometry).toBeDefined();
      }
    });

    it('should return null for non-existent ward ID', () => {
      const ward = findWardById(db, 999999);
      expect(ward).toBeNull();
    });
  });

  describe('findWardByCode', () => {
    it('should find a ward by its ward code', () => {
      // Using a known ward code (we'll first get one to test with)
      const sampleWard = db.prepare('SELECT ward_code FROM kenya_wards WHERE ward_code IS NOT NULL LIMIT 1').get();
      expect(sampleWard).toBeDefined();
      expect(sampleWard.ward_code).toBeDefined();
      
      const ward = findWardByCode(db, sampleWard.ward_code);
      
      expect(ward).toBeDefined();
      expect(ward).not.toBeNull();
      if (ward) {
        expect(ward.wardCode).toBe(sampleWard.ward_code);
        expect(ward.ward).toBeDefined();
        expect(ward.county).toBeDefined();
        expect(ward.geometry).toBeDefined();
      }
    });

    it('should return null for non-existent ward code', () => {
      const ward = findWardByCode(db, 'INVALID001');
      expect(ward).toBeNull();
    });
  });

  describe('findWardsByName', () => {
    it('should find wards by partial name match', () => {
      const wards = findWardsByName(db, 'Nairobi');
      
      expect(wards).toBeDefined();
      expect(Array.isArray(wards)).toBe(true);
      expect(wards.length).toBeGreaterThan(0);
      
      wards.forEach(ward => {
        expect(ward.ward.toLowerCase()).toContain('nairobi');
        expect(ward.id).toBeDefined();
        expect(ward.county).toBeDefined();
        expect(ward.geometry).toBeDefined();
      });
    });

    it('should return empty array for non-matching ward name', () => {
      const wards = findWardsByName(db, 'NonExistentWardName');
      expect(wards).toBeDefined();
      expect(Array.isArray(wards)).toBe(true);
      expect(wards.length).toBe(0);
    });
  });

  describe('findWardsByCountyPartial', () => {
    it('should find wards by county with default column selection', () => {
      const wards = findWardsByCountyPartial(db, 'Nairobi');
      
      expect(wards).toBeDefined();
      expect(Array.isArray(wards)).toBe(true);
      expect(wards.length).toBeGreaterThan(0);
      
      wards.forEach(ward => {
        expect(ward.id).toBeDefined();
        expect(ward.ward).toBeDefined();
        expect(ward.county).toBeDefined();
        // Geometry should not be included by default
        expect(ward.geometry).toBeUndefined();
      });
    });

    it('should find wards by county with specific column selection', () => {
      const wards = findWardsByCountyPartial(db, 'Nairobi', ['id', 'ward', 'geometry']);
      
      expect(wards).toBeDefined();
      expect(Array.isArray(wards)).toBe(true);
      expect(wards.length).toBeGreaterThan(0);
      
      wards.forEach(ward => {
        expect(ward.id).toBeDefined();
        expect(ward.ward).toBeDefined();
        expect(ward.geometry).toBeDefined();
        // These should not be included
        expect(ward.county).toBeUndefined();
        expect(ward.countyCode).toBeUndefined();
      });
    });

    it('should handle invalid column names gracefully', () => {
      const wards = findWardsByCountyPartial(db, 'Nairobi', ['id', 'invalid_column', 'ward']);
      
      expect(wards).toBeDefined();
      expect(Array.isArray(wards)).toBe(true);
      expect(wards.length).toBeGreaterThan(0);
      
      wards.forEach(ward => {
        expect(ward.id).toBeDefined();
        expect(ward.ward).toBeDefined();
        // Invalid column should be ignored
        expect((ward as any).invalid_column).toBeUndefined();
      });
    });

    it('should return empty array for non-existent county', () => {
      const wards = findWardsByCountyPartial(db, 'NonExistentCounty');
      expect(wards).toBeDefined();
      expect(Array.isArray(wards)).toBe(true);
      expect(wards.length).toBe(0);
    });
  });
});
