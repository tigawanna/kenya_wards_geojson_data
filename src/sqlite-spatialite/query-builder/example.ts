import { sql } from 'drizzle-orm';
import { kenyaWards } from '../schema.js';
import { createQueryBuilder, spatialFunctions } from './index.js';

// Example: Find wards containing a point
export function findWardsContainingPoint(latitude: number, longitude: number) {
  const point = spatialFunctions.makePoint(longitude, latitude);
  
  return createQueryBuilder(kenyaWards)
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      geometry: spatialFunctions.asGeoJSON(sql`geom`)
    })
    .whereContains('geom', point)  // 'geom' is type-checked against kenyaWards schema
    .limit(1);
}

// Example: Find nearest wards to a point
export function findNearestWardsToPoint(latitude: number, longitude: number, limit: number = 5) {
  const point = spatialFunctions.makePoint(longitude, latitude);
  
  return createQueryBuilder(kenyaWards)
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      distance: spatialFunctions.distance(sql`geom`, point),
      geometry: spatialFunctions.asGeoJSON(sql`geom`)
    })
    .orderByDistance('geom', point, 'asc')  // 'geom' is type-checked against kenyaWards schema
    .limit(limit);
}

// Example: Find wards by county
export function findWardsByCounty(countyName: string) {
  return createQueryBuilder(kenyaWards)
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      constituency: sql`constituency`,
      geometry: spatialFunctions.asGeoJSON(sql`geom`)
    })
    .whereLike('county', `%${countyName}%`);  // 'county' is type-checked against kenyaWards schema
}

// Example: Find wards in bounding box
export function findWardsInBoundingBox(minLat: number, minLng: number, maxLat: number, maxLng: number) {
  const bbox = spatialFunctions.buildMbr(minLng, minLat, maxLng, maxLat);
  
  return createQueryBuilder(kenyaWards)
    .select({
      id: sql`id`,
      wardCode: sql`ward_code`,
      ward: sql`ward`,
      county: sql`county`,
      geometry: spatialFunctions.asGeoJSON(sql`geom`)
    })
    .whereMbrWithin('geom', bbox);  // 'geom' is type-checked against kenyaWards schema
}

// Example: Find wards by name with type safety
export function findWardsByName(wardName: string) {
  return createQueryBuilder(kenyaWards)
    .select({
      id: sql`id`,
      ward: sql`ward`,
      county: sql`county`
    })
    .whereLike('ward', `%${wardName}%`)  // 'ward' is type-checked against kenyaWards schema
    .orderBy('county', 'asc')  // 'county' is type-checked against kenyaWards schema
    .limit(10);
}
