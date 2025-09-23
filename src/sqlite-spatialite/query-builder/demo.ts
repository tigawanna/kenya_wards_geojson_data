// Demo script to show the actual SQL output
import { sql } from 'drizzle-orm';
import { kenyaWards } from '../schema.js';
import { createQueryBuilder, spatialFunctions } from './index.js';

console.log('=== QueryBuilder SQL Output Demo ===\n');

// Demo 1: Basic SELECT query
console.log('1. Basic SELECT query:');
const basicQuery = createQueryBuilder(kenyaWards)
  .select({
    id: sql`id`,
    ward: sql`ward`,
    county: sql`county`
  });

console.log(basicQuery.toSQL().toString());
console.log('\n---\n');

// Demo 2: SELECT with WHERE conditions
console.log('2. SELECT with WHERE conditions:');
const whereQuery = createQueryBuilder(kenyaWards)
  .select({
    id: sql`id`,
    ward: sql`ward`,
    county: sql`county`
  })
  .whereEquals('county', 'Nairobi')
  .whereLike('ward', '%Central%');

console.log(whereQuery.toSQL().toString());
console.log('\n---\n');

// Demo 3: Spatial query
console.log('3. Spatial query:');
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

console.log(spatialQuery.toSQL().toString());
console.log('\n---\n');

// Demo 4: Complex spatial query
console.log('4. Complex spatial query:');
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

console.log(complexQuery.toSQL().toString());
console.log('\n---\n');

// Demo 5: Search query
console.log('5. Search query:');
const searchQuery = createQueryBuilder(kenyaWards)
  .select({
    id: sql`id`,
    wardCode: sql`ward_code`,
    ward: sql`ward`,
    county: sql`county`,
    constituency: sql`constituency`
  })
  .whereLike('ward', '%Nairobi%')
  .orderBy('ward', 'asc');

console.log(searchQuery.toSQL().toString());
console.log('\n---\n');

console.log('=== End of Demo ===');