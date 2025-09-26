import type { Database } from "better-sqlite3";
import { initDb } from "@/sqlite-spatialite/lib/client.js";

export interface Country {
  id: number;
  shapeName: string;
  shapeIso: string;
  shapeId: string | null;
  shapeGroup: string | null;
  shapeType: string | null;
}

/**
 * Check if a point (lat, lng) is within Kenya's borders
 */
export function isPointInKenya(db: Database, latitude: number, longitude: number): boolean {
  const stmt = db.prepare(`
    SELECT 1 
    FROM country 
    WHERE ST_Contains(geom, MakePoint(?, ?, 4326))
    LIMIT 1
  `);
  const result = stmt.get(longitude, latitude);
  return result !== undefined;
}

/**
 * Get country info if point is within borders
 */
export function getCountryAtPoint(db: Database, latitude: number, longitude: number): Country | null {
  const stmt = db.prepare(`
    SELECT 
      id,
      shape_name as shapeName,
      shape_iso as shapeIso,
      shape_id as shapeId,
      shape_group as shapeGroup,
      shape_type as shapeType
    FROM country 
    WHERE ST_Contains(geom, MakePoint(?, ?, 4326))
    LIMIT 1
  `);
  const result = stmt.get(longitude, latitude) as Country | null;
  return result || null;
}

/**
 * Get distance from point to Kenya border (in meters)
 */
export function getDistanceToKenyaBorder(db: Database, latitude: number, longitude: number): number {
  const stmt = db.prepare(`
    SELECT ST_Distance(geom, MakePoint(?, ?, 4326), 1) as distance
    FROM country
    LIMIT 1
  `);
  const result = stmt.get(longitude, latitude) as { distance: number } | null;
  return result?.distance || 0;
}

/**
 * Validate coordinates are within reasonable bounds for Kenya
 */
export function validateKenyaCoordinates(latitude: number, longitude: number): {
  valid: boolean;
  reason?: string;
} {
  // Kenya approximate bounds: lat -4.7 to 5.5, lng 33.9 to 41.9
  if (latitude < -5 || latitude > 6) {
    return { valid: false, reason: "Latitude outside Kenya region" };
  }
  if (longitude < 33 || longitude > 42) {
    return { valid: false, reason: "Longitude outside Kenya region" };
  }
  return { valid: true };
}

// Test function
async function main() {

  const { db } = initDb();
  
  console.log("Testing Kenya border queries...\n");
  
  // Test points inside Kenya
  const kenyaPoints = [
    { name: "Nairobi", lat: -1.286389, lng: 36.817223 },
    { name: "Kiambu", lat: -1.16972893282049, lng: 36.82946781044468 },
    { name: "Kalama", lat: -1.6725405427262028, lng: 37.25285675999058 },
    { name: "Machakos", lat: -0.8540481379611513, lng: 37.69510191590412 },
    { name: "Mombasa", lat: -4.0435, lng: 39.6682 },
  ];
  
  // Test points outside Kenya
  const nonKenyaPoints = [
    { name: "Kampala, Uganda", lat: 0.3476, lng: 32.5825 },
    { name: "Dar es Salaam, Tanzania", lat: -6.7924, lng: 39.2083 },
    { name: "Addis Ababa, Ethiopia", lat: 9.145, lng: 40.4897 },
    { name: "Mogadishu, Somalia", lat: 2.0469, lng: 45.3182 },
    { name: "London, UK", lat: 51.5074, lng: -0.1278 },
  ];
  
  console.log("=== POINTS INSIDE KENYA ===");
  for (const point of kenyaPoints) {
    const isInKenya = isPointInKenya(db, point.lat, point.lng);
    const country = getCountryAtPoint(db, point.lat, point.lng);
    const distance = getDistanceToKenyaBorder(db, point.lat, point.lng);
    const validation = validateKenyaCoordinates(point.lat, point.lng);
    
    console.log(`${point.name}:`);
    console.log(`  In Kenya: ${isInKenya}`);
    console.log(`  Country: ${country?.shapeName || 'None'}`);
    console.log(`  Distance to border: ${distance.toFixed(0)}m`);
    console.log(`  Validation: ${validation.valid}`);
    console.log();
  }
  
  console.log("=== POINTS OUTSIDE KENYA ===");
  for (const point of nonKenyaPoints) {
    const isInKenya = isPointInKenya(db, point.lat, point.lng);
    const country = getCountryAtPoint(db, point.lat, point.lng);
    const distance = getDistanceToKenyaBorder(db, point.lat, point.lng);
    const validation = validateKenyaCoordinates(point.lat, point.lng);
    
    console.log(`${point.name}:`);
    console.log(`  In Kenya: ${isInKenya}`);
    console.log(`  Country: ${country?.shapeName || 'None'}`);
    console.log(`  Distance to border: ${distance.toFixed(0)}m`);
    console.log(`  Validation: ${validation.valid} ${validation.reason ? '(' + validation.reason + ')' : ''}`);
    console.log();
  }
  
  db.close();
  console.log("Kenya border queries complete.");
}

main().catch(console.error);

