# Kenya Geospatial Data Integration Project

## Project Overview

This project integrates Kenya's ward boundary data into both PostgreSQL (with PostGIS) and SQLite (with SpatiaLite) databases. The main focus is on processing and storing geospatial data for Kenya's administrative divisions, specifically over 1,450 electoral wards across all 47 counties.

The project handles:
- Ward boundaries in GeoJSON format with MultiPolygon geometries
- Administrative hierarchy: County → Constituency → Ward → Sub-county
- Coordinate system: CRS84/EPSG:4326 (standard lat/lng)
- Data insertion and spatial querying capabilities

## Technologies Used

- **TypeScript** - Primary language
- **Drizzle ORM** - Database ORM for PostgreSQL integration
- **Better-SQLite3** - SQLite database driver
- **PostGIS** - PostgreSQL spatial extension
- **SpatiaLite** - SQLite spatial extension
- **Node.js** - Runtime environment

## Project Structure

```
src/
├── constants.ts                    # Project constants
├── data/                           # Data files
│   ├── kenya_wards.db             # SQLite database file
│   ├── sub_county.ts              # County-to-subcounty mappings
│   └── wards_geojson.ts           # Ward boundary geometries in GeoJSON
├── drizzle-pg-postgis/            # PostgreSQL/PostGIS integration
│   ├── insert_wards.ts            # Data insertion script
│   ├── ward-queries.ts            # Spatial query functions
│   └── lib/                       # Drizzle schema and client
└── sqlite-spatialite/             # SQLite/SpatiaLite integration
    ├── client.ts                  # Database initialization
    ├── insert-wards.ts            # Data insertion for SQLite
    ├── query-wards.ts             # Spatial queries for SQLite
    └── utils.ts                   # Utility functions
```

## Database Integration

### PostgreSQL/PostGIS Implementation

The project uses custom PostGIS types to work around a Drizzle ORM limitation with geometry types:
- Custom `multiPolygon`, `polygon`, and `point` types defined in `src/drizzle-pg-postgis/lib/postgis-types.ts`
- Schema defined in `src/drizzle-pg-postgis/lib/schema.ts`
- Spatial queries in `src/drizzle-pg-postgis/ward-queries.ts`

### SQLite/SpatiaLite Implementation

Alternative implementation using SQLite with SpatiaLite extension:
- Database initialization in `src/sqlite-spatialite/client.ts`
- Spatial queries in `src/sqlite-spatialite/query-wards.ts`

## Key Components

### Data Processing Pipeline

1. **GeoJSON Preparation**: Raw GeoJSON coordinates are processed and stored as GeoJSON text
2. **Sub-county Mapping**: Wards are mapped to sub-counties using data in `src/data/sub_county.ts`
3. **Database Insertion**: Data is inserted using Drizzle ORM with custom types handling PostGIS conversion

### Spatial Queries

Several spatial query functions are available:
- `findWardByPoint`: Find exact ward containing a point (lat, lng)
- `findNearestWard`: Find closest ward by distance
- `findWardSmart`: Try exact match first, fallback to nearest
- `findWardsWithinDistance`: Find wards within a specified distance
- `findWardsByCounty`: Find wards by county name
- `findWardsInBoundingBox`: Find wards within a rectangular area

## Development Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. For PostgreSQL/PostGIS:
   - Set `DATABASE_URL` environment variable
   - Ensure PostGIS extension is enabled in your PostgreSQL database

3. For SQLite/SpatiaLite:
   - Ensure SpatiaLite extension is installed and accessible
   - The database file will be created at `src/data/kenya_wards.db`

## Key PostGIS Functions Used

- `ST_Contains(ward_geometry, point)` - Point-in-polygon test
- `ST_Distance(ward_geometry, point)` - Calculate distance
- `geometry <-> point` - Fast distance operator for ordering
- `ST_DWithin(geometry, point, distance)` - Distance filtering
- `ST_GeomFromGeoJSON(json)` - Convert GeoJSON to PostGIS geometry
- `ST_SetSRID(geometry, 4326)` - Set coordinate reference system

## Performance Considerations

1. **Spatial Indexing**: GiST indexes provide O(log n) spatial query performance
2. **Coordinate Order**: PostGIS uses (longitude, latitude) internally
3. **SRID Consistency**: All geometries use EPSG:4326 for compatibility
4. **Batch Operations**: Use batch insertions for bulk ward data loading

## Troubleshooting

1. **"Geometry type mismatch"**: Ensure custom types are used instead of built-in `geometry()`
2. **"Invalid geometry"**: Source data may need `ST_MakeValid()` processing
3. **"No SRID"**: Custom types automatically set SRID=4326
4. **SpatiaLite extension errors**: Ensure the mod_spatialite extension is properly installed