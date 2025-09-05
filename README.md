# Kenya Geospatial Data Integration

**Data Sources:**
- [Kenya Counties & Subcounties](https://github.com/tigawanna/kenya-counties-subcounties)
- [Kenya Counties, Constituencies & Wards](https://github.com/tigawanna/data-Kenya-Counties-Constituencies-Wards)
- [Kenya County Assembly Boundaries (GeoJSON)](https://github.com/tigawanna/Kenya-County-Assembly-Boundaries)

This directory contains the Kenya ward boundary data and scripts for integrating it into our PostGIS-enabled PostgreSQL database using Drizzle ORM.

## Overview

Our Kenya dataset includes:

- **1,450+ electoral wards** across all 47 counties
- **MultiPolygon geometries** representing ward boundaries with islands/complex shapes
- **Administrative hierarchy**: County → Constituency → Ward → Sub-county
- **CRS84/EPSG:4326** coordinate system (standard lat/lng)

## Data Structure

### Source Files

- `wards_geojson.ts` - Complete ward boundary geometries in GeoJSON format
- `sub_county.ts` - County-to-subcounty mappings for administrative hierarchy
- `insert_wards.ts` - Data insertion script with geometry processing

### Ward Properties

Each ward feature contains:

```typescript
{
  id: string,           // Unique ward identifier
  wardcode: string,     // Official ward code
  ward: string,         // Ward name
  county: string,       // County name
  countycode: number,   // County code
  const: string,        // Constituency name
  constcode: number,    // Constituency code
  geometry: {           // MultiPolygon boundary
    type: "MultiPolygon",
    coordinates: number[][][][] // [polygon][ring][point][lng,lat]
  }
}
```

## PostGIS Custom Types

Due to a [known issue in Drizzle ORM](https://github.com/drizzle-team/drizzle-orm/issues/3040), the built-in `geometry()` function incorrectly generates `geometry(point)` columns regardless of the specified type and ignores SRID configuration.

### The Problem

```typescript
// This generates incorrect SQL: geometry(point) instead of geometry(MultiPolygon, 4326)
geometry("geometry", { type: "multipolygon", srid: 4326 });
```

### Our Solution: Custom Types

We created custom PostGIS types in `src/lib/drizzle/postgis-types.ts`:

```typescript
import { customType } from "drizzle-orm/pg-core";

export const multiPolygon = customType<{
  data: string; // GeoJSON string
}>({
  dataType() {
    return "geometry(MultiPolygon, 4326)";
  },
});

export const point = customType<{
  data: { x: number; y: number } | string;
}>({
  dataType() {
    return "geometry(Point, 4326)";
  },
});
```

### Schema Implementation

```typescript
export const kenyaWards = pgTable(
  "kenya_wards",
  {
    id: serial("id").primaryKey(),
    wardCode: varchar("ward_code", { length: 10 }).notNull(),
    ward: text("ward").notNull(),
    county: text("county").notNull(),
    countyCode: integer("county_code").notNull(),
    subCounty: text("sub_county"),
    constituency: text("constituency").notNull(),
    constituencyCode: integer("constituency_code").notNull(),
    geometry: multiPolygon("geometry").notNull(), // Uses custom type
  },
  (t) => [
    index("kenya_wards_geometry_gix").using("gist", t.geometry), // Spatial index
  ]
);
```

## Data Processing Pipeline

### 1. GeoJSON Preparation

```typescript
const geometry = {
  type: "MultiPolygon",
  coordinates: ward.coordinates, // Raw coordinates from geojson source // number[][][][] format
};

const processedWard = {
  ...ward,
  id: parseInt(ward.id, 10),
  countyCode: ward.countyCode ? ward.countyCode : -1,
  constituencyCode: ward.constituencyCode ? ward.constituencyCode : -1,
  subCounty: subCounty || "Unknown",
  // Store the geometry as GeoJSON text - will convert to PostGIS geometry in insert
  geometry: JSON.stringify(geometry),
};
```

### 2. Sub-county Mapping

```typescript
const getSubCounty = (ward: string): string | null => {
  const subCounty = SUB_COUNTY_MAPPINGS.find((item) => {
    const subCounties = Object.values(item.sub_counties).flat();
    return subCounties.some((subCountyWard) =>
      subCountyWard.toLowerCase().includes(ward.toLowerCase())
    );
  });
  return subCounty?.county_name || null;
};
```

### 3. Database Insertion

```typescript
// Simple batch insert - custom types handle PostGIS conversion
await db.insert(kenyaWards).values(wardsWithSubCounties);
```

## Spatial Queries

We provide comprehensive spatial query functions in `src/lib/drizzle/ward-queries.ts`:

### Point-in-Polygon (Exact Match)

```typescript
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
// Find the ward containing specific coordinates
const ward = await findWardByPoint(-1.2921, 36.8219); // Nairobi
```

### Nearest Neighbor

```typescript
// Find closest ward by distance
const nearestWard = await findNearestWard(-1.2921, 36.8219);
```

### Smart Search (Recommended)

```typescript
// Try exact match first, fallback to nearest
const ward = await findWardSmart(-1.2921, 36.8219);
```

### Distance-based Queries

```typescript
// Find all wards within 5km
const nearbyWards = await findWardsWithinDistance(-1.2921, 36.8219, 5000);
```

## Key PostGIS Functions Used

- `ST_Contains(ward_geometry, point)` - Point-in-polygon test
- `ST_Distance(ward_geometry, point)` - Calculate distance
- `geometry <-> point` - Fast distance operator for ordering
- `ST_DWithin(geometry, point, distance)` - Distance filtering
- `ST_GeomFromGeoJSON(json)` - Convert GeoJSON to PostGIS geometry
- `ST_SetSRID(geometry, 4326)` - Set coordinate reference system

## Usage Examples

### Find Ward by Coordinates

```typescript
import { findWardSmart } from "@/lib/drizzle/ward-queries";

// Example: Find ward containing Kenyatta University
const ward = await findWardSmart(-1.1677, 37.0162);
console.log(`${ward?.ward}, ${ward?.constituency}, ${ward?.county}`);
```

### Property Geocoding

```typescript
// When storing property locations
const property = {
  latitude: -1.2921,
  longitude: 36.8219,
  locationGeom: { x: 36.8219, y: -1.2921 }, // Point geometry
};

// Find administrative context
const ward = await findWardSmart(property.latitude, property.longitude);
```

## Database Schema

### Prerequisites

1. **PostGIS Extension**: `CREATE EXTENSION IF NOT EXISTS postgis;`
2. **UUID Extension**: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` (if using uuid_generate_v7)

### Indexes

- **Spatial Index**: GiST index on geometry column for fast spatial queries
- **Text Indexes**: Consider adding indexes on ward, county, constituency for text searches

### Migration Notes

- Custom types generate correct PostGIS column definitions
- Spatial indexes are automatically created via Drizzle schema
- No manual PostGIS function wrapping needed in queries thanks to custom types

## Performance Considerations

1. **Spatial Indexing**: GiST indexes provide O(log n) spatial query performance
2. **Coordinate Order**: PostGIS uses (longitude, latitude) internally
3. **SRID Consistency**: All geometries use EPSG:4326 for compatibility
4. **Batch Operations**: Use `db.insert().values()` for bulk ward insertions

## Troubleshooting

### Common Issues

1. **"Geometry type mismatch"**: Ensure custom types are used instead of built-in `geometry()`
2. **"Invalid geometry"**: Source data may need `ST_MakeValid()` processing
3. **"No SRID"**: Custom types automatically set SRID=4326

### Validation Queries

```sql
-- Check geometry validity
SELECT ward, ST_IsValid(geometry), ST_IsValidReason(geometry)
FROM kenya_wards WHERE NOT ST_IsValid(geometry);

-- Verify SRID and type
SELECT ward, ST_SRID(geometry), GeometryType(geometry)
FROM kenya_wards LIMIT 5;
```
