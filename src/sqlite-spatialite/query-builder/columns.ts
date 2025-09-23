import { sql } from 'drizzle-orm';
import { blob, real, integer, text } from 'drizzle-orm/sqlite-core';

// Geometry column helper for SpatiaLite
// In SpatiaLite, geometry is stored as BLOB but we work with it using specific functions
export function geometry(name: string) {
  return blob(name);
}

// Spatial functions that can be used in queries
export const spatialFunctions = {
  // ST_Contains(geom, point) - Check if geometry contains a point
  contains: (geom: string, point: string) => sql`ST_Contains(${sql.identifier(geom)}, ${point})`,
  
  // ST_Intersects(geom1, geom2) - Check if two geometries intersect
  intersects: (geom1: string, geom2: string) => sql`ST_Intersects(${sql.identifier(geom1)}, ${sql.identifier(geom2)})`,
  
  // ST_Distance(geom1, geom2) - Calculate distance between geometries
  distance: (geom1: string, geom2: string) => sql`ST_Distance(${sql.identifier(geom1)}, ${sql.identifier(geom2)})`,
  
  // MakePoint(x, y, srid) - Create a point geometry
  makePoint: (x: number, y: number, srid: number = 4326) => sql`MakePoint(${x}, ${y}, ${srid})`,
  
  // AsGeoJSON(geom) - Convert geometry to GeoJSON
  asGeoJSON: (geom: string) => sql`AsGeoJSON(${sql.identifier(geom)})`,
  
  // ST_GeomFromText(wkt, srid) - Create geometry from WKT
  geomFromText: (wkt: string, srid: number = 4326) => sql`ST_GeomFromText(${wkt}, ${srid})`,
  
  // ST_GeomFromGeoJSON(geojson) - Create geometry from GeoJSON
  geomFromGeoJSON: (geojson: string) => sql`ST_GeomFromGeoJSON(${geojson})`,
  
  // MbrWithin(geom, bbox) - Check if geometry's MBR is within bounding box
  mbrWithin: (geom: string, bbox: string) => sql`MbrWithin(${sql.identifier(geom)}, ${bbox})`,
  
  // BuildMbr(minx, miny, maxx, maxy, srid) - Build minimum bounding rectangle
  buildMbr: (minx: number, miny: number, maxx: number, maxy: number, srid: number = 4326) => 
    sql`BuildMbr(${minx}, ${miny}, ${maxx}, ${maxy}, ${srid})`,
  
  // ST_Simplify(geom, tolerance) - Simplify geometry
  simplify: (geom: string, tolerance: number) => sql`ST_Simplify(${sql.identifier(geom)}, ${tolerance})`,
};