import { describe, it, expect, beforeAll } from 'vitest';
import { initDb } from "@/sqlite-spatialite/lib/client.js";
import {
  findWardByPoint,
  findWardSmart,
  findWardsWithinDistance,
  findWardsByCounty,
  findWardsInBoundingBox,
  type Ward,
  findNearestWard,
  findAllWardsSimplified,
} from '@/sqlite-spatialite/wards/ward-query-helpers.js';
import { TEST_DB_PATH } from "@tests/constants.js";

import { knownLocations } from "@/data/mock-coordinates.js";

describe('SQLite Spatialite Ward Queries', () => {
  let db: any;

  beforeAll(async () => {
    const dbResult = await initDb(TEST_DB_PATH);
    db = dbResult.db;
  });

  describe('findWardByPoint', () => {
    knownLocations.slice(0, 2).forEach((location) => {
      it(`should find the correct ward for ${location.name}`, () => {
        const [lat, lng] = location.coordinates;
        const ward = findWardByPoint(db, lat, lng);

        expect(ward).toBeDefined();
        expect(ward).not.toBeNull();
        expect(ward?.ward.toLocaleLowerCase()).toBe(location.expected.ward.toLowerCase())
        if (ward) {
          expect(ward.county.toLowerCase()).toBe(location.expected.county.toLowerCase());
        }
      });
    });
  });

  describe('findNearestWard', () => {
    it(`should find the nearest ward for ${knownLocations[2].name}`, () => {
      const [lat, lng] = knownLocations[2].coordinates;
      const ward = findNearestWard(db, lat, lng);
      
      expect(ward).toBeDefined();
      expect(ward).not.toBeNull();
      if (ward) {
        expect(ward.distance).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('findWardSmart', () => {
    it(`should find the correct ward for ${knownLocations[3].name}`, () => {
      const [lat, lng] = knownLocations[3].coordinates;
      const ward = findWardSmart(db, lat, lng);
      
      expect(ward).toBeDefined();
      expect(ward).not.toBeNull();
    });
  });

  describe('findWardsWithinDistance', () => {
    it(`should find wards within 2000 meters of ${knownLocations[1].name}`, () => {
      const [lat, lng] = knownLocations[1].coordinates;
      const wards = findWardsWithinDistance(db, lat, lng, 2000);
      
      expect(wards).toBeDefined();
      expect(Array.isArray(wards)).toBe(true);
      expect(wards.length).toBeGreaterThan(0);
      
      wards.forEach(ward => {
        expect(ward).toHaveProperty('distance');
        expect(ward.distance).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('findWardsByCounty', () => {
    it(`should find all wards in ${knownLocations[0].expected.county} county`, () => {
      const county = knownLocations[0].expected.county;
      const wards = findWardsByCounty(db, county);
      
      expect(wards).toBeDefined();
      expect(Array.isArray(wards)).toBe(true);
      expect(wards.length).toBeGreaterThan(0);
      
      wards.forEach(ward => {
        expect(ward.county.toLowerCase()).toBe(county.toLocaleLowerCase());
      });
    });
  });

  describe('findWardsInBoundingBox', () => {
    it(`should find wards in a bounding box around ${knownLocations[0].name}`, () => {
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
