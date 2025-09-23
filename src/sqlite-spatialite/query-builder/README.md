# Type-Safe SpatiaLite Query Builder

A type-safe query builder for SpatiaLite spatial database operations that integrates with Drizzle ORM table schemas.

## Features

- **Type Safety**: Uses Drizzle table schemas to provide compile-time type checking
- **SELECT queries** with field aliases and type-safe column names
- **WHERE conditions** (equals, like, etc.) with type-safe column names
- **Spatial query functions** (contains, distance, etc.) with type-safe column names
- **ORDER BY and LIMIT** clauses with type-safe column names
- **Method chaining** for building complex queries

## Usage

### Importing

```typescript
import { createQueryBuilder, spatialFunctions } from './src/sqlite-spatialite/query-builder';
import { kenyaWards } from './src/sqlite-spatialite/schema';
```

### Creating a Type-Safe Query

```typescript
// Create a query builder with full type safety
const query = createQueryBuilder(kenyaWards);
```

### Type-Safe SELECT Fields

```typescript
const query = createQueryBuilder(kenyaWards)
  .select({
    id: sql`id`,
    ward: sql`ward`,
    county: sql`county`
  });
```

### Type-Safe WHERE Conditions

```typescript
// Basic WHERE conditions with type safety
const query = createQueryBuilder(kenyaWards)
  .whereEquals('county', 'Nairobi')  // 'county' must exist in kenyaWards schema
  .whereLike('ward', '%Central%');   // 'ward' must exist in kenyaWards schema

// Spatial WHERE conditions with type safety
const point = spatialFunctions.makePoint(36.817223, -1.286389);
const query = createQueryBuilder(kenyaWards)
  .whereContains('geom', point);  // 'geom' must exist in kenyaWards schema
```

### Type-Safe ORDER BY and LIMIT

```typescript
const query = createQueryBuilder(kenyaWards)
  .orderBy('ward', 'asc')  // 'ward' must exist in kenyaWards schema
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
const query = createQueryBuilder(kenyaWards)
  .select({
    id: sql`id`,
    ward: sql`ward`,
    county: sql`county`,
    geometry: spatialFunctions.asGeoJSON(sql`geom`)
  })
  .whereContains('geom', point)        // 'geom' is type-checked
  .orderByDistance('geom', point, 'asc') // 'geom' is type-checked
  .limit(5);
```

## Testing

Run tests with:

```bash
npm run test:run -- tests/sqlite-spatialite/typesafe-query-builder.test.ts
```