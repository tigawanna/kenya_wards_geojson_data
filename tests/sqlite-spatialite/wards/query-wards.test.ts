import { describe, it, expect, beforeAll } from 'vitest';
import { initDb } from '@/sqlite-spatialite/query-builder/client.js';
import {
  findWardByPoint,
  findNearestWard,
  findWardSmart,
  findWardsWithinDistance,
  findWardsByCounty,
  findWardsInBoundingBox,
  findAllWardsSimplified
} from '@/sqlite-spatialite/wards/query-wards.js';

describe('SQLite Spatialite Ward Queries', () => {
  let db: any;

  beforeAll(async () => {
    const dbResult = await initDb();
    db = dbResult.db;
  });

  describe('findWardByPoint', () => {
    it('should find the correct ward for Nairobi coordinates', () => {
      const [nairobiLat, nairobiLng] = [-1.286389, 36.817223];
      const ward = findWardByPoint(db, nairobiLat, nairobiLng);
      
      expect(ward).toBeDefined();
      expect(ward).not.toBeNull();
      if (ward) {
        expect(ward.county.toLowerCase()).toBe('nairobi');
        // Note: The ward code may vary, so we're not checking it specifically
      }
    });

    it('should find the correct ward for Kiambu coordinates', () => {
      const [kiambuLat, kiambuLng] = [-1.16972893282049, 36.82946781044468];
      const ward = findWardByPoint(db, kiambuLat, kiambuLng);
      
      expect(ward).toBeDefined();
      expect(ward).not.toBeNull();
      if (ward) {
        expect(ward.county.toLowerCase()).toBe('kiambu');
      }
    });
  });

  describe('findNearestWard', () => {
    it('should find the nearest ward for Kalama coordinates', () => {
      const [kalamaLat, kalamaLng] = [-1.6725405427262028, 37.25285675999058];
      const ward = findNearestWard(db, kalamaLat, kalamaLng);
      
      expect(ward).toBeDefined();
      expect(ward).not.toBeNull();
      if (ward) {
        expect(ward.distance).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('findWardSmart', () => {
    it('should find the correct ward for Machakos coordinates', () => {
      const [machakosLat, machakosLng] = [-0.8540481379611513, 37.69510191590412];
      const ward = findWardSmart(db, machakosLat, machakosLng);
      
      expect(ward).toBeDefined();
      expect(ward).not.toBeNull();
    });
  });

  describe('findWardsWithinDistance', () => {
    it('should find wards within 2000 meters of Kiambu coordinates', () => {
      const [kiambuLat, kiambuLng] = [-1.16972893282049, 36.82946781044468];
      const wards = findWardsWithinDistance(db, kiambuLat, kiambuLng, 2000);
      
      expect(wards).toBeDefined();
      expect(Array.isArray(wards)).toBe(true);
      expect(wards.length).toBeGreaterThan(0);
      
      // Check that all wards have distance property
      wards.forEach(ward => {
        expect(ward).toHaveProperty('distance');
        expect(ward.distance).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('findWardsByCounty', () => {
    it('should find all wards in Nairobi county', () => {
      const wards = findWardsByCounty(db, 'Nairobi');
      
      expect(wards).toBeDefined();
      expect(Array.isArray(wards)).toBe(true);
      expect(wards.length).toBeGreaterThan(0);
      
      // Check that all wards are in Nairobi
      wards.forEach(ward => {
        expect(ward.county.toLowerCase()).toBe('nairobi');
      });
    });
  });

  describe('findWardsInBoundingBox', () => {
    it('should find wards in a bounding box around Nairobi', () => {
      const wards = findWardsInBoundingBox(db, -1.35, 36.7, -1.2, 36.9);
      
      expect(wards).toBeDefined();
      expect(Array.isArray(wards)).toBe(true);
      expect(wards.length).toBeGreaterThan(0);
    });
  });

  describe('findAllWardsSimplified', () => {
    it('should find all wards with simplified geometry', () => {
      const wards = findAllWardsSimplified(db, 0.001);
      
      expect(wards).toBeDefined();
      expect(Array.isArray(wards)).toBe(true);
      expect(wards.length).toBeGreaterThan(0);
      
      // Check that all wards have geometry property
      wards.forEach(ward => {
        expect(ward).toHaveProperty('geometry');
        expect(typeof ward.geometry).toBe('string');
      });
    });
  });
});
