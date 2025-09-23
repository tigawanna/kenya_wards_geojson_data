import { sql } from 'drizzle-orm';
import { SpatiaLiteQueryBuilder, spatialFunctions } from './index.js';

// Example: Find wards containing a point
export function findWardsContainingPoint(latitude: number, longitude: number) {
  const point = spatialFunctions.makePoint(longitude, latitude);
  
  return new SpatiaLiteQueryBuilder('kenya_wards')
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
  
  return new SpatiaLiteQueryBuilder('kenya_wards')
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      distance: spatialFunctions.distance('geom', point.toString()),
      geometry: spatialFunctions.asGeoJSON('geom')
    })
    .orderByDistance('geom', point, 'asc')
    .limit(limit);
}

// Example: Find wards within a distance from a point
export function findWardsWithinDistance(latitude: number, longitude: number, maxDistance: number) {
  const point = spatialFunctions.makePoint(longitude, latitude);
  
  return new SpatiaLiteQueryBuilder('kenya_wards')
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      distance: spatialFunctions.distance('geom', point.toString()),
      geometry: spatialFunctions.asGeoJSON('geom')
    })
    .whereDistanceWithin('geom', point, maxDistance)
    .orderByDistance('geom', point, 'asc');
}

// Example: Find wards by county
export function findWardsByCounty(countyName: string) {
  return new SpatiaLiteQueryBuilder('kenya_wards')
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
  
  return new SpatiaLiteQueryBuilder('kenya_wards')
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      geometry: spatialFunctions.asGeoJSON('geom')
    })
    .whereMbrWithin('geom', bbox);
}

// Example: Find simplified wards for faster rendering
export function findSimplifiedWards(tolerance: number = 0.001) {
  return new SpatiaLiteQueryBuilder('kenya_wards')
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      geometry: spatialFunctions.simplify('geom', tolerance)
    });
}
