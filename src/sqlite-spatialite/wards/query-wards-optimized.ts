import type { Database } from "better-sqlite3";

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