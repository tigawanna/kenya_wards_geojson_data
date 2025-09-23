import { sql } from 'drizzle-orm';
import { kenyaWards } from '../schema.js';
import { createQueryBuilder, spatialFunctions } from './index.js';

// Test the query builder's ability to output SQL
export function testQueryBuilderSQL() {
  console.log('Testing QueryBuilder SQL Output...\\n');

  // Test basic SELECT
  const basicQuery = createQueryBuilder(kenyaWards)
    .select({
      id: sql`id`,
      ward: sql`ward`,
      county: sql`county`
    });
  
  console.log('Basic SELECT Query SQL:');
  console.log(basicQuery.toSQL().toSQL().sql);
  console.log();

  // Test WHERE conditions
  const whereQuery = createQueryBuilder(kenyaWards)
    .select({
      id: sql`id`,
      ward: sql`ward`,
      county: sql`county`
    })
    .whereEquals('county', 'Nairobi')
    .whereLike('ward', '%Central%');
  
  console.log('SELECT with WHERE Query SQL:');
  console.log(whereQuery.toSQL().toSQL().sql);
  console.log();

  // Test spatial query
  const point = spatialFunctions.makePoint(36.817223, -1.286389);
  const spatialQuery = createQueryBuilder(kenyaWards)
    .select({
      id: sql`id`,
      ward: sql`ward`,
      county: sql`county`,
      geometry: spatialFunctions.asGeoJSON(sql`geom`)
    })
    .whereContains('geom', point)
    .orderBy('ward', 'asc')
    .limit(5);
  
  console.log('Spatial Query SQL:');
  console.log(spatialQuery.toSQL().toSQL().sql);
  console.log();

  // Test complex query
  const complexQuery = createQueryBuilder(kenyaWards)
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      distance: spatialFunctions.distance(sql`geom`, point),
      geometry: spatialFunctions.asGeoJSON(sql`geom`)
    })
    .whereContains('geom', point)
    .orderByDistance('geom', point, 'asc')
    .limit(10);
  
  console.log('Complex Spatial Query SQL:');
  console.log(complexQuery.toSQL().toSQL().sql);
  console.log();

  return {
    basic: basicQuery.toSQL().toSQL().sql,
    where: whereQuery.toSQL().toSQL().sql,
    spatial: spatialQuery.toSQL().toSQL().sql,
    complex: complexQuery.toSQL().toSQL().sql
  };
}

// Example of how to use in React Native
export function exampleReactNativeUsage() {
    // In React Native, you'd use the built SQL like this:
  const point = spatialFunctions.makePoint(36.817223, -1.286389);
  
  const query = createQueryBuilder(kenyaWards)
    .select({
      id: sql`id`,
      ward: sql`ward`,
      county: sql`county`,
      geometry: spatialFunctions.asGeoJSON(sql`geom`)
    })
    .whereContains('geom', point)
    .limit(1);

  // Get the raw SQL string
  const rawSQL = query.toSQL();
  const params = query.toSQL()
  
  console.log('Raw SQL for React Native:');
  console.log('SQL:', rawSQL);
  console.log('Params:', params);
  
  // In React Native you would then execute this SQL with your DB adapter
  // e.g., with SQLite:
  // db.executeSql(rawSQL, params, successCallback, errorCallback);
  
  return { sql: rawSQL, params };
}
