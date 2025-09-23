// Example of how to use the query builder in React Native
import { sql } from 'drizzle-orm';
import { kenyaWards } from '../schema.js';
import { createQueryBuilder, spatialFunctions } from './index.js';

/**
 * Example usage in React Native
 * 
 * This demonstrates how to use the query builder to generate SQL
 * that can be executed with React Native SQLite libraries
 */

// Example 1: Find wards containing a specific point
export function findWardAtLocation(latitude: number, longitude: number) {
  const point = spatialFunctions.makePoint(longitude, latitude);
  
  // Build the query
  const query = createQueryBuilder(kenyaWards)
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      geometry: spatialFunctions.asGeoJSON(sql`geom`)
    })
    .whereContains('geom', point)
    .limit(1);
  
  // Get the SQL and parameters for React Native
  return query.toSQL().toString();
  // In React Native, you would execute this with your SQLite adapter:
  // const results = await db.executeSql(query.toSQL().toString());
}

// Example 2: Find nearest wards to a point
export function findNearestWards(latitude: number, longitude: number, limit: number = 5) {
  const point = spatialFunctions.makePoint(longitude, latitude);
  
  const query = createQueryBuilder(kenyaWards)
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      distance: spatialFunctions.distance(sql`geom`, point),
      geometry: spatialFunctions.asGeoJSON(sql`geom`)
    })
    .orderByDistance('geom', point, 'asc')
    .limit(limit);
  
  return query.toSQL().toString();
  // In React Native:
  // const results = await db.executeSql(query.toSQL().toString());
}

// Example 3: Search wards by name
export function searchWardsByName(searchTerm: string) {
  const query = createQueryBuilder(kenyaWards)
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      constituency: sql`constituency`
    })
    .whereLike('ward', `%${searchTerm}%`)
    .orderBy('ward', 'asc');
  
  return query.toSQL().toString();
  // In React Native:
  // const results = await db.executeSql(query.toSQL().toString());
}

// Example 4: Find wards by county
export function findWardsByCounty(countyName: string) {
  const query = createQueryBuilder(kenyaWards)
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      constituency: sql`constituency`
    })
    .whereEquals('county', countyName)
    .orderBy('ward', 'asc');
  
  return query.toSQL().toString();
  // In React Native:
  // const results = await db.executeSql(query.toSQL().toString());
}

// Example 5: Find wards in bounding box
export function findWardsInBoundingBox(minLat: number, minLng: number, maxLat: number, maxLng: number) {
  const bbox = spatialFunctions.buildMbr(minLng, minLat, maxLng, maxLat);
  
  const query = createQueryBuilder(kenyaWards)
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      geometry: spatialFunctions.asGeoJSON(sql`geom`)
    })
    .whereMbrWithin('geom', bbox);
  
  return query.toSQL().toString();
  // In React Native:
  // const results = await db.executeSql(query.toSQL().toString());
}

// React Native usage example:
/*
import * as ReactNativeQueryBuilder from './react-native-example.js';

// In your React Native component:
async function loadWardsAtLocation() {
  try {
    // Generate the SQL query
    const sqlQuery = ReactNativeQueryBuilder.findWardAtLocation(-1.286389, 36.817223);
    
    // Execute with your React Native SQLite library
    // For example, with react-native-sqlite-storage:
    const results = await db.executeSql(sqlQuery);
    
    // Process results
    const wards = results.rows.raw();
    console.log('Found wards:', wards);
    
    return wards;
  } catch (error) {
    console.error('Error loading wards:', error);
  }
}
*/