import { sql } from "drizzle-orm/sql";
import { customType } from "drizzle-orm/sqlite-core";

/**
 * SpatiaLite Geometry Types for Drizzle ORM
 * 
 * IMPORTANT: When querying geometry columns for React Native/MapLibre usage,
 * always convert BLOB geometry to GeoJSON using AsGeoJSON():
 * 
 * ✅ CORRECT:
 * SELECT AsGeoJSON(geom) AS geom FROM table_name
 * 
 * ❌ WRONG:
 * SELECT geom FROM table_name  -- Returns binary WKB data
 * 
 * WHY: BLOB type in Drizzle assumes Node.js Buffer existence, which is not
 * available in React Native. Raw BLOB queries will fail or return unusable data.
 * AsGeoJSON() converts the binary WKB to a JSON string that works everywhere.
 * 
 * Example query:
 * const result = db.prepare(`
 *   SELECT id, name, AsGeoJSON(geom) AS geom 
 *   FROM kenya_wards 
 *   WHERE id = ?
 * `).get(wardId);
 * 
 * Then parse the GeoJSON string:
 * const geometry = JSON.parse(result.geom);
 */


// Point geometry type
export const point = customType<{
  data: string; // GeoJSON string or "POINT(lng lat)"
}>({
  dataType() {
    return "blob"; // SpatiaLite stores all geometries as WKB in BLOB
  },
  toDriver(value) {
    return sql`ST_MakeValid(GeomFromGeoJSON(${value}))`;
  },
});

// MultiPoint geometry type
export const multiPoint = customType<{
  data: string; // GeoJSON string
}>({
  dataType() {
    return "blob";
  },
  toDriver(value) {
    return sql`ST_MakeValid(GeomFromGeoJSON(${value}))`;
  },
});

// LineString geometry type
export const lineString = customType<{
  data: string; // GeoJSON string
}>({
  dataType() {
    return "blob";
  },
  toDriver(value) {
    return sql`ST_MakeValid(GeomFromGeoJSON(${value}))`;
  },
});

// MultiLineString geometry type
export const multiLineString = customType<{
  data: string; // GeoJSON string
}>({
  dataType() {
    return "blob";
  },
  toDriver(value) {
    return sql`ST_MakeValid(GeomFromGeoJSON(${value}))`;
  },
});

// Polygon geometry type
export const polygon = customType<{
  data: string; // GeoJSON string
}>({
  dataType() {
    return "blob";
  },
  toDriver(value) {
    return sql`ST_MakeValid(GeomFromGeoJSON(${value}))`;
  },
});

// MultiPolygon geometry type
export const multiPolygon = customType<{
  data: string; // GeoJSON string
}>({
  dataType() {
    return "blob";
  },
  toDriver(value) {
    return sql`ST_MakeValid(GeomFromGeoJSON(${value}))`;
  },
});

// Generic geometry type (accepts any geometry)
export const geometry = customType<{
  data: string; // GeoJSON string
}>({
  dataType() {
    return "blob";
  },
  toDriver(value) {
    return sql`ST_MakeValid(GeomFromGeoJSON(${value}))`;
  },
});

// Geometry collection type
export const geometryCollection = customType<{
  data: string; // GeoJSON string
}>({
  dataType() {
    return "blob";
  },
  toDriver(value) {
    return sql`ST_MakeValid(GeomFromGeoJSON(${value}))`;
  },
});
