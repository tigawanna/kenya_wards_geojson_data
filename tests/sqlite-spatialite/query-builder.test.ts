import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { createQueryBuilder, spatialFunctions } from '../../src/sqlite-spatialite/query-builder/index.js';

describe('SpatiaLite Query Builder', () => {
  it('should create a basic query builder', () => {
    const query = createQueryBuilder('kenya_wards');
    expect(query).toBeDefined();
  });

  it('should build a select query', () => {
    const query = createQueryBuilder('kenya_wards')
      .select({
        id: sql`id`,
        ward: sql`ward`,
        county: sql`county`
      });
    expect(query).toBeDefined();
  });

  it('should build a query with where conditions', () => {
    const query = createQueryBuilder('kenya_wards')
      .whereEquals('county', 'Nairobi')
      .whereLike('ward', '%Central%');
    expect(query).toBeDefined();
  });

  it('should build a query with spatial conditions', () => {
    const point = spatialFunctions.makePoint(36.817223, -1.286389);
    const query = createQueryBuilder('kenya_wards')
      .whereContains('geom', point);
    expect(query).toBeDefined();
  });

  it('should build a query with ordering', () => {
    const query = createQueryBuilder('kenya_wards')
      .orderBy(sql`ward`, 'asc');
    expect(query).toBeDefined();
  });

  it('should build a query with limit', () => {
    const query = createQueryBuilder('kenya_wards')
      .limit(10);
    expect(query).toBeDefined();
  });

  it('should build a complex query with multiple clauses', () => {
    const point = spatialFunctions.makePoint(36.817223, -1.286389);
    const query = createQueryBuilder('kenya_wards')
      .select({
        id: sql`id`,
        ward: sql`ward`,
        county: sql`county`,
        geometry: spatialFunctions.asGeoJSON('geom')
      })
      .whereContains('geom', point)
      .orderByDistance('geom', point, 'asc')
      .limit(5);
    expect(query).toBeDefined();
  });
});