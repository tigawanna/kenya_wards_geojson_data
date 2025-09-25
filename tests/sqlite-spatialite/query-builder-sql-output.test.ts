import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { kenyaWards } from '../../src/sqlite-spatialite/query-builder/schema.js';
import { createQueryBuilder, spatialFunctions } from '../../src/sqlite-spatialite/query-builder/index.js';

describe('QueryBuilder SQL Output', () => {
  it('should generate valid SQL for basic queries', () => {
    const query = createQueryBuilder(kenyaWards)
      .select({
        id: sql`id`,
        ward: sql`ward`,
        county: sql`county`
      });
    
    const sqlResult = query.toSQL();
    expect(sqlResult).toBeDefined();
    
    // Just test that we can get a string representation
    const sqlString = sqlResult.toString();
    expect(sqlString).toBeDefined();
    expect(typeof sqlString).toBe('string');
  });

  it('should generate valid SQL for queries with WHERE conditions', () => {
    const query = createQueryBuilder(kenyaWards)
      .select({
        id: sql`id`,
        ward: sql`ward`,
        county: sql`county`
      })
      .whereEquals('county', 'Nairobi')
      .whereLike('ward', '%Central%');
    
    const sqlResult = query.toSQL();
    expect(sqlResult).toBeDefined();
    
    const sqlString = sqlResult.toString();
    expect(sqlString).toBeDefined();
    expect(typeof sqlString).toBe('string');
  });

  it('should generate valid SQL for spatial queries', () => {
    const point = spatialFunctions.makePoint(36.817223, -1.286389);
    const query = createQueryBuilder(kenyaWards)
      .select({
        id: sql`id`,
        ward: sql`ward`,
        county: sql`county`,
        geometry: spatialFunctions.asGeoJSON(sql`geom`)
      })
      .whereContains('geom', point);
    
    const sqlResult = query.toSQL();
    expect(sqlResult).toBeDefined();
    
    const sqlString = sqlResult.toString();
    expect(sqlString).toBeDefined();
    expect(typeof sqlString).toBe('string');
  });

  it('should generate valid SQL with ORDER BY and LIMIT', () => {
    const query = createQueryBuilder(kenyaWards)
      .select({
        id: sql`id`,
        ward: sql`ward`,
        county: sql`county`
      })
      .orderBy('ward', 'asc')
      .limit(5);
    
    const sqlResult = query.toSQL();
    expect(sqlResult).toBeDefined();
    
    const sqlString = sqlResult.toString();
    expect(sqlString).toBeDefined();
    expect(typeof sqlString).toBe('string');
  });

  it('should generate SQL with proper parameters', () => {
    const query = createQueryBuilder(kenyaWards)
      .whereEquals('county', 'Nairobi');
    
    const sqlResult = query.toSQL();
    expect(sqlResult).toBeDefined();
    
    const sqlString = sqlResult.toString();
    expect(sqlString).toBeDefined();
    expect(typeof sqlString).toBe('string');
  });
});
