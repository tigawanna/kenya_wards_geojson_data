# Testing

This project uses Vitest for testing both SQLite/SpatiaLite and PostgreSQL/PostGIS implementations.

## Test Structure

```
tests/
├── sqlite-spatialite/
│   ├── wards/
│   │   ├── query-wards.test.ts          # Tests for regular ward queries
│   │   ├── query-wards-optimized.test.ts # Tests for optimized ward queries
│   │   └── query-comparison.test.ts     # Tests comparing regular vs optimized queries
│   └── country/
└── drizzle-pg-postgis/
    └── wards/
        └── query-wards.test.ts          # Tests for PostgreSQL/PostGIS ward queries
```

## Running Tests

```bash
# Run all tests in watch mode
npm run test

# Run all tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Test Database Setup

### SQLite/SpatiaLite

Tests use the existing `src/data/kenya_wards.db` database file. Make sure this file exists and contains the ward data before running tests.

To initialize the SQLite database:
```bash
npm run init-sqlite
```

### PostgreSQL/PostGIS

Tests require a PostgreSQL database with the PostGIS extension enabled and the `kenya_wards` table populated with data. Set the `DATABASE_URL` environment variable before running PostgreSQL tests.

## Test Coverage

Test coverage reports are generated when running `npm run test:coverage`. Reports are available in the `coverage/` directory.