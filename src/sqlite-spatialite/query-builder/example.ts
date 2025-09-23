import { sql } from 'drizzle-orm';
import { createQueryBuilder, spatialFunctions } from './index.js';

// Example: Find wards containing a point
export function findWardsContainingPoint(latitude: number, longitude: number) {
  const point = spatialFunctions.makePoint(longitude, latitude);
  
  return createQueryBuilder('kenya_wards')
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      geometry: spatialFunctions.asGeoJSON('geom')
    })
    .whereContains('geom', point)
    .limit(1);
}

// Example: Find nearest wards to a point
export function findNearestWardsToPoint(latitude: number, longitude: number, limit: number = 5) {
  const point = spatialFunctions.makePoint(longitude, latitude);
  
  return createQueryBuilder('kenya_wards')
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      distance: spatialFunctions.distance('geom', point),
      geometry: spatialFunctions.asGeoJSON('geom')
    })
    .orderByDistance('geom', point, 'asc')
    .limit(limit);
}

// Example: Find wards by county
export function findWardsByCounty(countyName: string) {
  return createQueryBuilder('kenya_wards')
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      constituency: sql`constituency`,
      geometry: spatialFunctions.asGeoJSON('geom')
    })
    .whereLike('county', `%${countyName}%`);
}

// Example: Find wards in bounding box
export function findWardsInBoundingBox(minLat: number, minLng: number, maxLat: number, maxLng: number) {
  const bbox = spatialFunctions.buildMbr(minLng, minLat, maxLng, maxLat);
  
  return createQueryBuilder('kenya_wards')
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      geometry: spatialFunctions.asGeoJSON('geom')
    })
    .whereMbrWithin('geom', bbox);
}
