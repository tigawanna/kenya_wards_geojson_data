import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { SpatiaLiteQueryBuilder, spatialFunctions } from '../../src/sqlite-spatialite/query-builder';

describe('SpatiaLite Query Builder', () => {
  describe('Basic Query Building', () => {
    it('should create a query builder instance', () => {
      const query = new SpatiaLiteQueryBuilder('kenya_wards');
      expect(query).toBeInstanceOf(SpatiaLiteQueryBuilder);
    });

    it('should allow method chaining for select', () => {
      const query = new SpatiaLiteQueryBuilder('kenya_wards')
        .select({
          id: sql`id`,
          ward: sql`ward`,
          county: sql`county`
        });
      expect(query).toBeInstanceOf(SpatiaLiteQueryBuilder);
    });

    it('should allow method chaining for where conditions', () => {
      const query = new SpatiaLiteQueryBuilder('kenya_wards')
        .whereEquals('county', 'Nairobi')
        .whereLike('ward', '%Central%');
      expect(query).toBeInstanceOf(SpatiaLiteQueryBuilder);
    });

    it('should allow method chaining for ordering', () => {
      const query = new SpatiaLiteQueryBuilder('kenya_wards')
        .orderBy(sql`ward`, 'asc');
      expect(query).toBeInstanceOf(SpatiaLiteQueryBuilder);
    });

    it('should allow method chaining for limit and offset', () => {
      const query = new SpatiaLiteQueryBuilder('kenya_wards')
        .limit(10)
        .offset(20);
      expect(query).toBeInstanceOf(SpatiaLiteQueryBuilder);
    });
  });

  describe('Spatial Query Building', () => {
    it('should allow method chaining for spatial contains condition', () => {
      const point = spatialFunctions.makePoint(36.817223, -1.286389);
      const query = new SpatiaLiteQueryBuilder('kenya_wards')
        .whereContains('geom', point);
      expect(query).toBeInstanceOf(SpatiaLiteQueryBuilder);
    });

    it('should allow method chaining for spatial distance ordering', () => {
      const point = spatialFunctions.makePoint(36.817223, -1.286389);
      const query = new SpatiaLiteQueryBuilder('kenya_wards')
        .orderByDistance('geom', point, 'asc')
        .limit(5);
      expect(query).toBeInstanceOf(SpatiaLiteQueryBuilder);
    });

    it('should allow method chaining for bounding box condition', () => {
      const bbox = spatialFunctions.buildMbr(36.7, -1.35, 36.9, -1.2);
      const query = new SpatiaLiteQueryBuilder('kenya_wards')
        .whereMbrWithin('geom', bbox);
      expect(query).toBeInstanceOf(SpatiaLiteQueryBuilder);
    });
  });

  describe('Example Queries', () => {
    it('should allow chaining for point containment query', () => {
      const point = spatialFunctions.makePoint(36.817223, -1.286389);
      const query = new SpatiaLiteQueryBuilder('kenya_wards')
        .select({
          id: sql`id`,
          wardCode: sql`ward_code`,
          ward: sql`ward`,
          county: sql`county`,
          geometry: spatialFunctions.asGeoJSON('geom')
        })
        .whereContains('geom', point)
        .limit(1);
      expect(query).toBeInstanceOf(SpatiaLiteQueryBuilder);
    });

    it('should allow chaining for nearest wards query', () => {
      const point = spatialFunctions.makePoint(36.817223, -1.286389);
      const query = new SpatiaLiteQueryBuilder('kenya_wards')
        .select({
          id: sql`id`,
          wardCode: sql`ward_code`,
          ward: sql`ward`,
          county: sql`county`,
          distance: spatialFunctions.distance('geom', point.toString()),
          geometry: spatialFunctions.asGeoJSON('geom')
        })
        .orderByDistance('geom', point, 'asc')
        .limit(5);
      expect(query).toBeInstanceOf(SpatiaLiteQueryBuilder);
    });
  });
});