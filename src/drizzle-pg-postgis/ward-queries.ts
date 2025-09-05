import { sql } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";
import { kenyaWards } from "./lib/schema.js";
import { db } from "./lib/client.js";

/**
 * Find the ward that contains a given point (lat, lng)
 * This is the most accurate method - checks if the point is actually inside the ward boundary
 */
export async function findWardByPoint(latitude: number, longitude: number) {
  const point = sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
  
  const result = await db
    .select({
      ...getTableColumns(kenyaWards),
    })
    .from(kenyaWards)
    .where(sql`ST_Contains(${kenyaWards.geometry}, ${point})`)
    .limit(1);

  return result[0] || null;
}

/**
 * Find the nearest ward to a given point (lat, lng) by distance
 * Useful as a fallback if the point doesn't fall exactly within any ward boundary
 */
export async function findNearestWard(latitude: number, longitude: number) {
  const point = sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
  
  const result = await db
    .select({
      ...getTableColumns(kenyaWards),
      distance: sql<number>`ST_Distance(${kenyaWards.geometry}, ${point})`.as('distance'),
    })
    .from(kenyaWards)
    .orderBy(sql`${kenyaWards.geometry} <-> ${point}`)
    .limit(1);

  return result[0] || null;
}

/**
 * Find wards within a specified distance (in meters) from a point
 */
export async function findWardsWithinDistance(
  latitude: number, 
  longitude: number, 
  distanceMeters: number = 1000
) {
  const point = sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
  
  const result = await db
    .select({
      ...getTableColumns(kenyaWards),
      distance: sql<number>`ST_Distance(${kenyaWards.geometry}, ${point})`.as('distance'),
    })
    .from(kenyaWards)
    .where(sql`ST_DWithin(${kenyaWards.geometry}, ${point}, ${distanceMeters})`)
    .orderBy(sql`${kenyaWards.geometry} <-> ${point}`);

  return result;
}

/**
 * Smart ward finder - tries ST_Contains first, falls back to nearest if no exact match
 */
export async function findWardSmart(latitude: number, longitude: number) {
  // First try to find exact ward containing the point
  let ward = await findWardByPoint(latitude, longitude);
  
  if (!ward) {
    // If no exact match, find the nearest ward
    ward = await findNearestWard(latitude, longitude);
  }
  
  return ward;
}

/**
 * Find wards by county name
 */
export async function findWardsByCounty(countyName: string) {
  const result = await db
    .select()
    .from(kenyaWards)
    .where(sql`LOWER(${kenyaWards.county}) = LOWER(${countyName})`);

  return result;
}

/**
 * Find wards within a bounding box (rectangular area)
 */
export async function findWardsInBoundingBox(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number
) {
  const envelope = sql`ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)`;
  
  const result = await db
    .select()
    .from(kenyaWards)
    .where(sql`ST_Intersects(${kenyaWards.geometry}, ${envelope})`);

  return result;
}

// Example usage:
// const ward = await findWardSmart(-1.2921, 36.8219); // Nairobi coordinates
// console.log(ward?.ward, ward?.county);
