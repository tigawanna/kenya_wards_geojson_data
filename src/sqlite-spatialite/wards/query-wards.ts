import { count } from "drizzle-orm";
import type { Database } from "better-sqlite3";
import { initDb } from "../query-builder/client.js";


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

// Partial ward interface for selective column queries
export interface PartialWard {
  id?: number;
  wardCode?: string;
  ward?: string;
  county?: string;
  countyCode?: number;
  subCounty?: string | null;
  constituency?: string;
  constituencyCode?: number;
  geometry?: string; // GeoJSON string
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
 * Find a ward by its ID
 */
export function findWardById(db: Database, id: number): Ward | null {
  const stmt = db.prepare(`
    SELECT 
      id, ward_code as wardCode, ward, county, county_code as countyCode, 
      sub_county as subCounty, constituency, constituency_code as constituencyCode,
      AsGeoJSON(geom) as geometry 
    FROM kenya_wards
    WHERE id = ?
    LIMIT 1
  `);
  const result = stmt.get(id) as Ward | null;
  return result || null;
}

/**
 * Find a ward by its ward code
 */
export function findWardByCode(db: Database, wardCode: string): Ward | null {
  const stmt = db.prepare(`
    SELECT 
      id, ward_code as wardCode, ward, county, county_code as countyCode, 
      sub_county as subCounty, constituency, constituency_code as constituencyCode,
      AsGeoJSON(geom) as geometry 
    FROM kenya_wards
    WHERE ward_code = ?
    LIMIT 1
  `);
  const result = stmt.get(wardCode) as Ward | null;
  return result || null;
}

/**
 * Find wards by partial ward name match
 */
export function findWardsByName(db: Database, wardName: string): Ward[] {
  const stmt = db.prepare(`
    SELECT 
      id, ward_code as wardCode, ward, county, county_code as countyCode, 
      sub_county as subCounty, constituency, constituency_code as constituencyCode,
      AsGeoJSON(geom) as geometry 
    FROM kenya_wards 
    WHERE LOWER(ward) LIKE LOWER(?)
  `);
  const results = stmt.all(`%${wardName}%`);
  return results as Ward[];
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
 * Find wards by county name with partial column selection
 */
export function findWardsByCountyPartial(
  db: Database, 
  countyName: string, 
  columns: string[] = ['id', 'ward', 'county']
): PartialWard[] {
  // Validate columns to prevent SQL injection
  const validColumns = {
    'id': 'id',
    'wardCode': 'ward_code',
    'ward': 'ward',
    'county': 'county',
    'countyCode': 'county_code',
    'subCounty': 'sub_county',
    'constituency': 'constituency',
    'constituencyCode': 'constituency_code',
    'geometry': 'AsGeoJSON(geom) as geometry'
  };
  
  // Filter to only valid columns
  const selectedColumns = columns
    .filter(col => validColumns.hasOwnProperty(col))
    .map(col => validColumns[col as keyof typeof validColumns]);
  
  // Default to all columns if none are valid
  const selectClause = selectedColumns.length > 0 ? selectedColumns.join(', ') : '*';
  
  const stmt = db.prepare(`
    SELECT ${selectClause}
    FROM kenya_wards 
    WHERE LOWER(county) = LOWER(?)
  `);
  const results = stmt.all(countyName);
  return results as PartialWard[];
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
  
  console.log("Testing spatial queries...\n");
  const [nairobiLat, nairobiLng] = [-1.286389, 36.817223];
  const nairobiPoint = findWardSmart(db, nairobiLat, nairobiLng);
  console.log({
    expected: "Nairobi central area",
    county: nairobiPoint?.county,
    constituency: nairobiPoint?.constituency,
    ward: nairobiPoint?.ward,
  });

  const [kiambuLat, kiambuLng] = [-1.16972893282049, 36.82946781044468];
  const kiambuPoint = findWardSmart(db, kiambuLat, kiambuLng);
  console.log({
    expected: "Kiambu riabia area",
    county: kiambuPoint?.county,
    constituency: kiambuPoint?.constituency,
    ward: kiambuPoint?.ward,
  });

  const [kalamaLat, kalamaLng] = [-1.6725405427262028, 37.25285675999058];
  const kalamaPoint = findWardSmart(db, kalamaLat, kalamaLng);
  console.log({
    expected: "Makueni Kalama area",
    county: kalamaPoint?.county,
    constituency: kalamaPoint?.constituency,
    ward: kalamaPoint?.ward,
  });

  const [machakosLat, machakosLng] = [-0.8540481379611513, 37.69510191590412];
  const machakosPoint = findWardSmart(db, machakosLat, machakosLng);
  console.log({
    expected: "Machakos kivaa area",
    county: machakosPoint?.county,
    constituency: machakosPoint?.constituency,
    ward: machakosPoint?.ward,
  });
  

  // console.log("\n2. Find nearest ward:");
  // const nearestWard = findNearestWard(lat, lng);
  // console.log(
  //   nearestWard
  //     ? `${nearestWard.ward}, ${nearestWard.county} (${nearestWard.distance.toFixed(2)}m)`
  //     : "No ward found"
  // );

  console.log("\n3. Find wards within 2000 meters:");
  const nearbyWards = findWardsWithinDistance(db, kiambuLat, kiambuLng, 2000);
  console.log(`Found ${nearbyWards.map((ward) => ward.ward).join(", ")} wards within 2000m`);



  console.log("\n5. Find wards by county (Nairobi):");
  const nairobiWards = findWardsByCounty(db, "Nairobi");
  console.log(`Found ${nairobiWards.length} wards in Nairobi`);

  console.log("\n6. Find wards in bounding box:");
  const bboxWards = findWardsInBoundingBox(db, -1.35, 36.7, -1.2, 36.9);
  console.log(`Found ${bboxWards.length} wards in bounding box`);

  console.log("\nDatabase queries complete.");
}

main()
  .then(() => {
    console.log("\nAll queries executed successfully.");
  })
  .catch((error) => {
    console.error("\nError in main execution:", error);
  });
