/**
 * Custom PostGIS Geometry Types for Drizzle ORM
 * 
 * Workaround for Drizzle's geometry type generation bug:
 * https://github.com/drizzle-team/drizzle-orm/issues/3040
 * 
 * The built-in geometry() function incorrectly generates "geometry(point)" 
 * regardless of the specified type and ignores SRID configuration.
 */

import { customType } from "drizzle-orm/pg-core";

// MultiPolygon type for complex boundaries (e.g., Kenya wards with islands)
export const multiPolygon = customType<{
  data: string; // GeoJSON string or raw coordinates
}>({
  dataType() {
    return "geometry(MultiPolygon, 4326)";
  },
});

// Polygon type for simple boundaries
export const polygon = customType<{
  data: string; // GeoJSON string or raw coordinates
}>({
  dataType() {
    return "geometry(Polygon, 4326)";
  },
});

// Point type with correct SRID
export const point = customType<{
  data: { x: number; y: number } | string; // Point object or GeoJSON string
}>({
  dataType() {
    return "geometry(Point, 4326)";
  },
});

// Helper types for GeoJSON structures
export type GeoJSONPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

export type GeoJSONMultiPolygon = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

export type GeoJSONPoint = {
  type: "Point";
  coordinates: [number, number];
};

// Helper functions to create GeoJSON objects
export function createPolygon(coordinates: number[][][]): GeoJSONPolygon {
  return {
    type: "Polygon",
    coordinates,
  };
}

export function createMultiPolygon(
  coordinates: number[][][][],
): GeoJSONMultiPolygon {
  return {
    type: "MultiPolygon",
    coordinates,
  };
}

export function createPoint(coordinates: [number, number]): GeoJSONPoint {
  return {
    type: "Point",
    coordinates,
  };
}
