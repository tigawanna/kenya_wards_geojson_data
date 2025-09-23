# SpatiaLite Query Builder

A simple query builder for SpatiaLite spatial database operations.

## Features

- Basic SELECT queries with field aliases
- WHERE conditions (equals, like, etc.)
- Spatial query functions (contains, distance, etc.)
- ORDER BY and LIMIT clauses
- Method chaining for building complex queries

## Usage

### Importing

```typescript
import { createQueryBuilder, spatialFunctions } from './src/sqlite-spatialite/query-builder';
```

### Creating a Query

```typescript
// Create a query builder for a table
const query = createQueryBuilder('kenya_wards');
```

### SELECT Fields

```typescript
const query = createQueryBuilder('kenya_wards')
  .select({
    id: sql`id`,
    ward: sql`ward`,
    county: sql`county`
  });
```

### WHERE Conditions

```typescript
// Basic WHERE conditions
const query = createQueryBuilder('kenya_wards')
  .whereEquals('county', 'Nairobi')
  .whereLike('ward', '%Central%');

// Spatial WHERE conditions
const point = spatialFunctions.makePoint(36.817223, -1.286389);
const query = createQueryBuilder('kenya_wards')
  .whereContains('geom', point);
```

### ORDER BY and LIMIT

```typescript
const query = createQueryBuilder('kenya_wards')
  .orderBy(sql`ward`, 'asc')
  .limit(10);
```

### Spatial Functions

The query builder provides several spatial functions:

- `spatialFunctions.contains(geomColumn, point)` - Check if geometry contains a point
- `spatialFunctions.distance(geomColumn, point)` - Calculate distance between geometries
- `spatialFunctions.makePoint(x, y, srid)` - Create a point geometry
- `spatialFunctions.asGeoJSON(geomColumn)` - Convert geometry to GeoJSON
- `spatialFunctions.mbrWithin(geomColumn, bbox)` - Check if geometry's MBR is within bounding box
- `spatialFunctions.buildMbr(minx, miny, maxx, maxy, srid)` - Build minimum bounding rectangle
- `spatialFunctions.simplify(geomColumn, tolerance)` - Simplify geometry

### Complex Example

```typescript
const point = spatialFunctions.makePoint(36.817223, -1.286389);
const query = createQueryBuilder('kenya_wards')
  .select({
    id: sql`id`,
    ward: sql`ward`,
    county: sql`county`,
    geometry: spatialFunctions.asGeoJSON('geom')
  })
  .whereContains('geom', point)
  .orderByDistance('geom', point, 'asc')
  .limit(5);
```

## Testing

Run tests with:

```bash
npm run test:run -- tests/sqlite-spatialite/query-builder.test.ts
```