import { count } from "drizzle-orm";
import type { Database } from "better-sqlite3";
import { initDb } from "../client.js";
import {
  findWardByPointOptimized,
  findNearestWardOptimized,
  findWardSmartOptimized,
  findWardsInBoundingBoxOptimized,
  getWardsByCodesOptimized,
  calculateCombinedBBox
} from "./query-wards-optimized.js";

// The structure of a ward, based on your Drizzle schema.
export interface Ward {
  id: number;
  wardCode: string;
  ward: string;
  county: string;
  countyCode: number;
  subCounty: string | null;
  constituency: string;
  constituencyCode: number;
  geometry: string; // GeoJSON string
}

/**
 * Find the ward that contains a given point (lat, lng).
 * This is the most accurate method - checks if the point is actually inside the ward boundary.
 */
export function findWardByPoint(db: Database, latitude: number, longitude: number): Ward | null {
  const stmt = db.prepare(`
    SELECT 
      id, ward_code as wardCode, ward, county, county_code as countyCode, 
      sub_county as subCounty, constituency, constituency_code as constituencyCode,
      AsGeoJSON(geom) as geometry 
    FROM kenya_wards
    WHERE ST_Contains(geom, MakePoint(?, ?, 4326))
    LIMIT 1
  `);
  const result = stmt.get(longitude, latitude) as Ward | null;
  return result || null;
}

/**
 * Find the nearest ward to a given point (lat, lng) by distance.
 * Useful as a fallback if the point doesn't fall exactly within any ward boundary.
 */
export function findNearestWard(
  db: Database,
  latitude: number,
  longitude: number
): (Ward & { distance: number }) | null {
  const stmt = db.prepare(`
    SELECT 
      id, ward_code as wardCode, ward, county, county_code as countyCode, 
      sub_county as subCounty, constituency, constituency_code as constituencyCode,
      AsGeoJSON(geom) as geometry, 
      ST_Distance(geom, MakePoint(?, ?, 4326)) as distance
    FROM kenya_wards
    ORDER BY ST_Distance(geom, MakePoint(?, ?, 4326))
    LIMIT 1
  `);
  const result = stmt.get(longitude, latitude, longitude, latitude) as
    | (Ward & { distance: number })
    | null;
  return result || null;
}

/**
 * Find wards within a specified distance (in meters) from a point.
 * Uses Haversine formula for accurate distance calculation in meters.
 */
export function findWardsWithinDistance(
  db: Database,
  latitude: number,
  longitude: number,
  distanceMeters: number = 1000
): (Ward & { distance: number })[] {
  const stmt = db.prepare(`
    SELECT 
      id, ward_code as wardCode, ward, county, county_code as countyCode, 
      sub_county as subCounty, constituency, constituency_code as constituencyCode,
      AsGeoJSON(geom) as geometry, 
      ST_Distance(
        geom, 
        MakePoint(?, ?, 4326),
        1  -- Use ellipsoidal distance (in meters)
      ) as distance
    FROM kenya_wards
    WHERE ST_Distance(
      geom, 
      MakePoint(?, ?, 4326),
      1  -- Use ellipsoidal distance (in meters)
    ) < ?
    ORDER BY distance
  `);
  const results = stmt.all(longitude, latitude, longitude, latitude, distanceMeters);
  return results as (Ward & { distance: number })[];
}

/**
 * Smart ward finder - tries ST_Contains first, falls back to nearest if no exact match.
 */
export function findWardSmart(
  db: Database,
  latitude: number,
  longitude: number
): Ward | (Ward & { distance: number }) | null {
  let ward = findWardByPoint(db, latitude, longitude);
  if (!ward) {
    ward = findNearestWard(db, latitude, longitude);
  }
  return ward;
}

/**
 * Find wards by county name.
 */
export function findWardsByCounty(db: Database, countyName: string): Ward[] {
  const stmt = db.prepare(`
    SELECT 
      id, ward_code as wardCode, ward, county, county_code as countyCode, 
      sub_county as subCounty, constituency, constituency_code as constituencyCode,
      AsGeoJSON(geom) as geometry 
    FROM kenya_wards 
    WHERE LOWER(county) = LOWER(?)
  `);
  const results = stmt.all(countyName);
  return results as Ward[];
}

/**
 * Find wards within a bounding box (rectangular area).
 */
export function findWardsInBoundingBox(
  db: Database,
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number
): Ward[] {
  const stmt = db.prepare(`
    SELECT 
      id, ward_code as wardCode, ward, county, county_code as countyCode, 
      sub_county as subCounty, constituency, constituency_code as constituencyCode,
      AsGeoJSON(geom) as geometry 
    FROM kenya_wards
    WHERE MbrWithin(geom, BuildMbr(?, ?, ?, ?, 4326))
  `);
  const results = stmt.all(minLng, minLat, maxLng, maxLat);
  return results as Ward[];
}

/**
 * Find all wards with simplified geometry for faster rendering
 */
export function findAllWardsSimplified(db: Database, tolerance: number = 0.001): Ward[] {
  const stmt = db.prepare(`
    SELECT 
      id, ward_code as wardCode, ward, county, county_code as countyCode, 
      sub_county as subCounty, constituency, constituency_code as constituencyCode,
      AsGeoJSON(ST_Simplify(geom, ?)) as geometry 
    FROM kenya_wards
  `);
  const results = stmt.all(tolerance);
  return results as Ward[];
}

async function main() {
  const { db } = await initDb()
  const { db:optz_db } = initDb();
  
  console.log("Testing spatial queries...\n");
  
  // Nairobi test
  const [nairobiLat, nairobiLng] = [-1.286389, 36.817223];
  const nairobiPoint = findWardSmart(db, nairobiLat, nairobiLng);
  const nairobiPointOptz = findWardSmart(optz_db, nairobiLat, nairobiLng);
  console.log("NAIROBI - Regular DB:", {
    county: nairobiPoint?.county,
    constituency: nairobiPoint?.constituency,
    ward: nairobiPoint?.ward,
  });
  console.log("NAIROBI - Optimized DB:", {
    county: nairobiPointOptz?.county,
    constituency: nairobiPointOptz?.constituency,
    ward: nairobiPointOptz?.ward,
  });

  // Kiambu test
  const [kiambuLat, kiambuLng] = [-1.16972893282049, 36.82946781044468];
  const kiambuPoint = findWardSmart(db, kiambuLat, kiambuLng);
  const kiambuPointOptz = findWardSmart(optz_db, kiambuLat, kiambuLng);
  console.log("\nKIAMBU - Regular DB:", {
    county: kiambuPoint?.county,
    constituency: kiambuPoint?.constituency,
    ward: kiambuPoint?.ward,
  });
  console.log("KIAMBU - Optimized DB:", {
    county: kiambuPointOptz?.county,
    constituency: kiambuPointOptz?.constituency,
    ward: kiambuPointOptz?.ward,
  });

  // Kalama test
  const [kalamaLat, kalamaLng] = [-1.6725405427262028, 37.25285675999058];
  const kalamaPoint = findWardSmart(db, kalamaLat, kalamaLng);
  const kalamaPointOptz = findWardSmart(optz_db, kalamaLat, kalamaLng);
  console.log("\nKALAMA - Regular DB:", {
    county: kalamaPoint?.county,
    constituency: kalamaPoint?.constituency,
    ward: kalamaPoint?.ward,
  });
  console.log("KALAMA - Optimized DB:", {
    county: kalamaPointOptz?.county,
    constituency: kalamaPointOptz?.constituency,
    ward: kalamaPointOptz?.ward,
  });

  // Machakos test
  const [machakosLat, machakosLng] = [-0.8540481379611513, 37.69510191590412];
  const machakosPoint = findWardSmart(db, machakosLat, machakosLng);
  const machakosPointOptz = findWardSmart(optz_db, machakosLat, machakosLng);
  console.log("\nMACHAKOS - Regular DB:", {
    county: machakosPoint?.county,
    constituency: machakosPoint?.constituency,
    ward: machakosPoint?.ward,
  });
  console.log("MACHAKOS - Optimized DB:", {
    county: machakosPointOptz?.county,
    constituency: machakosPointOptz?.constituency,
    ward: machakosPointOptz?.ward,
  });
  


  // Wards within distance test
  const nearbyWards = findWardsWithinDistance(db, kiambuLat, kiambuLng, 2000);
  const nearbyWardsOptz = findWardsWithinDistance(optz_db, kiambuLat, kiambuLng, 2000);
  console.log("\nWARDS WITHIN 2000m - Regular DB:", `Found ${nearbyWards.length} wards`);
  console.log("WARDS WITHIN 2000m - Optimized DB:", `Found ${nearbyWardsOptz.length} wards`);

  // County wards test
  const nairobiWards = findWardsByCounty(db, "Nairobi");
  const nairobiWardsOptz = findWardsByCounty(optz_db, "Nairobi");
  console.log("\nNAIROBI WARDS - Regular DB:", `Found ${nairobiWards.length} wards`);
  console.log("NAIROBI WARDS - Optimized DB:", `Found ${nairobiWardsOptz.length} wards`);

  // Bounding box test
  const bboxWards = findWardsInBoundingBox(db, -1.35, 36.7, -1.2, 36.9);
  const bboxWardsOptz = findWardsInBoundingBox(optz_db, -1.35, 36.7, -1.2, 36.9);
  console.log("\nBOUNDING BOX - Regular DB:", `Found ${bboxWards.length} wards`);
  console.log("BOUNDING BOX - Optimized DB:", `Found ${bboxWardsOptz.length} wards`);

  console.log("\n=== OPTIMIZED QUERIES COMPARISON ===");
  
  // Test optimized point queries
  const nairobiOptimized = findWardByPointOptimized(optz_db, nairobiLat, nairobiLng);
  const kiambuOptimized = findWardByPointOptimized(optz_db, kiambuLat, kiambuLng);
  console.log("\nOPTIMIZED POINT QUERIES:");
  console.log("Nairobi:", nairobiOptimized?.ward);
  console.log("Kiambu:", kiambuOptimized?.ward);
  
  // Test optimized bbox calculation
  const testWards = getWardsByCodesOptimized(optz_db, ['001001', '001002']);
  const bbox = calculateCombinedBBox(testWards);
  console.log("\nOPTIMIZED BBOX (no geometry parsing):", bbox);
  
  // Test optimized bounding box query
  const bboxOptimized = findWardsInBoundingBoxOptimized(optz_db, -1.35, 36.7, -1.2, 36.9);
  console.log("\nOPTIMIZED BBOX QUERY:", `Found ${bboxOptimized.length} wards`);

  console.log("\nDatabase queries complete.");
}

main()
  .then(() => {
    console.log("\nAll queries executed successfully.");
  })
  .catch((error) => {
    console.error("\nError in main execution:", error);
  });
