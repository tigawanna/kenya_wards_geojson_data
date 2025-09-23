# SpatiaLite Query Builder

A query builder specifically designed for SpatiaLite spatial database operations, built on top of Drizzle ORM.

## Features

- Table definition system similar to Drizzle ORM
- Spatial query building with SpatiaLite functions
- Geometry column support
- Method chaining for building complex queries
- Support for common spatial operations

## Installation

The query builder is part of the Kenya Wards GeoJSON project. No additional installation is required.

## Usage

### Importing the Query Builder

```typescript
import { SpatiaLiteQueryBuilder, spatialFunctions } from './src/sqlite-spatialite/query-builder';
```

### Creating a Basic Query

```typescript
// Create a query builder for the kenya_wards table
const query = new SpatiaLiteQueryBuilder('kenya_wards');

// Select specific fields
const query = new SpatiaLiteQueryBuilder('kenya_wards')
  .select({
    id: sql`id`,
    ward: sql`ward`,
    county: sql`county`
  });

// Add WHERE conditions
const query = new SpatiaLiteQueryBuilder('kenya_wards')
  .whereEquals('county', 'Nairobi')
  .whereLike('ward', '%Central%');

// Add ORDER BY, LIMIT, and OFFSET
const query = new SpatiaLiteQueryBuilder('kenya_wards')
  .orderBy(sql`ward`, 'asc')
  .limit(10)
  .offset(20);
```

### Spatial Queries

```typescript
// Find wards containing a point
const point = spatialFunctions.makePoint(36.817223, -1.286389);
const query = new SpatiaLiteQueryBuilder('kenya_wards')
  .select({
    id: sql`id`,
    ward: sql`ward`,
    geometry: spatialFunctions.asGeoJSON('geom')
  })
  .whereContains('geom', point)
  .limit(1);

// Find nearest wards to a point
const point = spatialFunctions.makePoint(36.817223, -1.286389);
const query = new SpatiaLiteQueryBuilder('kenya_wards')
  .select({
    id: sql`id`,
    ward: sql`ward`,
    distance: spatialFunctions.distance('geom', point.toString())
  })
  .orderByDistance('geom', point, 'asc')
  .limit(5);

// Find wards within a bounding box
const bbox = spatialFunctions.buildMbr(36.7, -1.35, 36.9, -1.2);
const query = new SpatiaLiteQueryBuilder('kenya_wards')
  .select({
    id: sql`id`,
    ward: sql`ward`,
    geometry: spatialFunctions.asGeoJSON('geom')
  })
  .whereMbrWithin('geom', bbox);
```

### Available Spatial Functions

- `spatialFunctions.contains(geom, point)` - Check if geometry contains a point
- `spatialFunctions.intersects(geom1, geom2)` - Check if two geometries intersect
- `spatialFunctions.distance(geom1, geom2)` - Calculate distance between geometries
- `spatialFunctions.makePoint(x, y, srid)` - Create a point geometry
- `spatialFunctions.asGeoJSON(geom)` - Convert geometry to GeoJSON
- `spatialFunctions.geomFromText(wkt, srid)` - Create geometry from WKT
- `spatialFunctions.geomFromGeoJSON(geojson)` - Create geometry from GeoJSON
- `spatialFunctions.mbrWithin(geom, bbox)` - Check if geometry's MBR is within bounding box
- `spatialFunctions.buildMbr(minx, miny, maxx, maxy, srid)` - Build minimum bounding rectangle
- `spatialFunctions.simplify(geom, tolerance)` - Simplify geometry

## Examples

See `src/sqlite-spatialite/query-builder/examples.ts` for more examples of common spatial queries.

## Testing

Run tests with:

```bash
npm run test:run -- tests/sqlite-spatialite/query-builder.test.ts
```