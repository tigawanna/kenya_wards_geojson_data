import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { kenyaWards } from '../../src/sqlite-spatialite/schema.js';
import { createQueryBuilder, spatialFunctions } from '../../src/sqlite-spatialite/query-builder/index.js';

describe('TypeSafe SpatiaLite Query Builder', () => {
  it('should create a typesafe query builder with table schema', () => {
    const query = createQueryBuilder(kenyaWards);
    expect(query).toBeDefined();
  });

  it('should build a select query with type-safe column names', () => {
    const query = createQueryBuilder(kenyaWards)
      .select({
        id: sql`id`,
        ward: sql`ward`,
        county: sql`county`
      });
    expect(query).toBeDefined();
  });

  it('should build a query with type-safe where conditions', () => {
    const query = createQueryBuilder(kenyaWards)
      .whereEquals('county', 'Nairobi')  // 'county' is type-checked against kenyaWards schema
      .whereLike('ward', '%Central%');   // 'ward' is type-checked against kenyaWards schema
    expect(query).toBeDefined();
  });

  it('should build a query with type-safe spatial conditions', () => {
    const point = spatialFunctions.makePoint(36.817223, -1.286389);
    const query = createQueryBuilder(kenyaWards)
      .whereContains('geom', point);  // 'geom' is type-checked against kenyaWards schema
    expect(query).toBeDefined();
  });

  it('should build a query with type-safe ordering', () => {
    const query = createQueryBuilder(kenyaWards)
      .orderBy('ward', 'asc');  // 'ward' is type-checked against kenyaWards schema
    expect(query).toBeDefined();
  });

  it('should build a complex query with type-safe multiple clauses', () => {
    const point = spatialFunctions.makePoint(36.817223, -1.286389);
    const query = createQueryBuilder(kenyaWards)
      .select({
        id: sql`id`,
        ward: sql`ward`,
        county: sql`county`,
        geometry: spatialFunctions.asGeoJSON(sql`geom`)
      })
      .whereContains('geom', point)
      .orderBy('ward', 'asc')
      .limit(5);
    expect(query).toBeDefined();
  });
});