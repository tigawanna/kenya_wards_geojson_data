import type { Database } from "better-sqlite3";

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

export interface OptimizedWard {
  id: number;
  wardCode: string;
  ward: string;
  county: string;
  countyCode: number;
  subCounty: string | null;
  constituency: string;
  constituencyCode: number;
  minx: number;
  miny: number;
  maxx: number;
  maxy: number;
  geometry: string; // Simplified GeoJSON string
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

/* 
 * ============================================================================
 * REGULAR QUERY FUNCTIONS
 * ============================================================================
 */

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

/* 
 * ============================================================================
 * OPTIMIZED QUERY FUNCTIONS (using bounding box pre-filtering)
 * ============================================================================
 */

/**
 * Fast point-in-polygon using bounding box pre-filter + ST_Contains
 */
export function findWardByPointOptimized(db: Database, latitude: number, longitude: number): OptimizedWard | null {
  const stmt = db.prepare(`
    SELECT 
      id, ward_code as wardCode, ward, county, county_code as countyCode, 
      sub_county as subCounty, constituency, constituency_code as constituencyCode,
      minx, miny, maxx, maxy,
      AsGeoJSON(geom) as geometry 
    FROM kenya_wards
    WHERE ? BETWEEN minx AND maxx 
      AND ? BETWEEN miny AND maxy
      AND ST_Contains(geom, MakePoint(?, ?, 4326))
    LIMIT 1
  `);
  const result = stmt.get(longitude, latitude, longitude, latitude) as OptimizedWard | null;
  return result || null;
}

/**
 * Fast nearest ward using spatial index
 */
export function findNearestWardOptimized(
  db: Database,
  latitude: number,
  longitude: number
): (OptimizedWard & { distance: number }) | null {
  const stmt = db.prepare(`
    SELECT 
      id, ward_code as wardCode, ward, county, county_code as countyCode, 
      sub_county as subCounty, constituency, constituency_code as constituencyCode,
      minx, miny, maxx, maxy,
      AsGeoJSON(geom) as geometry, 
      ST_Distance(geom, MakePoint(?, ?, 4326)) as distance
    FROM kenya_wards
    ORDER BY ST_Distance(geom, MakePoint(?, ?, 4326))
    LIMIT 1
  `);
  const result = stmt.get(longitude, latitude, longitude, latitude) as
    | (OptimizedWard & { distance: number })
    | null;
  return result || null;
}

/**
 * Fast bounding box query - no geometry parsing needed for zoom
 */
export function findWardsInBoundingBoxOptimized(
  db: Database,
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number
): OptimizedWard[] {
  const stmt = db.prepare(`
    SELECT 
      id, ward_code as wardCode, ward, county, county_code as countyCode, 
      sub_county as subCounty, constituency, constituency_code as constituencyCode,
      minx, miny, maxx, maxy,
      AsGeoJSON(geom) as geometry 
    FROM kenya_wards
    WHERE NOT (maxx < ? OR minx > ? OR maxy < ? OR miny > ?)
  `);
  const results = stmt.all(minLng, maxLng, minLat, maxLat);
  return results as OptimizedWard[];
}

/**
 * Get wards by codes - optimized for map rendering
 */
export function getWardsByCodesOptimized(db: Database, wardCodes: string[]): OptimizedWard[] {
  const placeholders = wardCodes.map(() => "?").join(",");
  const stmt = db.prepare(`
    SELECT 
      id, ward_code as wardCode, ward, county, county_code as countyCode, 
      sub_county as subCounty, constituency, constituency_code as constituencyCode,
      minx, miny, maxx, maxy,
      AsGeoJSON(geom) as geometry 
    FROM kenya_wards
    WHERE ward_code IN (${placeholders})
  `);
  const results = stmt.all(...wardCodes);
  return results as OptimizedWard[];
}

/**
 * Smart ward finder with bbox pre-filter
 */
export function findWardSmartOptimized(
  db: Database,
  latitude: number,
  longitude: number
): OptimizedWard | (OptimizedWard & { distance: number }) | null {
  let ward = findWardByPointOptimized(db, latitude, longitude);
  if (!ward) {
    ward = findNearestWardOptimized(db, latitude, longitude);
  }
  return ward;
}

/**
 * Calculate combined bounding box from multiple wards - no geometry parsing
 */
export function calculateCombinedBBox(wards: OptimizedWard[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (wards.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  return {
    minX: Math.min(...wards.map(w => w.minx)),
    minY: Math.min(...wards.map(w => w.miny)),
    maxX: Math.max(...wards.map(w => w.maxx)),
    maxY: Math.max(...wards.map(w => w.maxy)),
  };
}