import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { initDb } from "@/sqlite-spatialite/lib/client.js";
import Database from "better-sqlite3";
import { TEST_DB_PATH } from "@tests/constants.js";
import * as schema from "@/sqlite-spatialite/lib/drizzle/schema.js";
import { kenyaWards, wardUpdates, wardEvents } from "@/sqlite-spatialite/lib/drizzle/schema.js";
import { getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import { setupDb } from "@/sqlite-spatialite/init_sqlite_db.js";

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

describe("Schema Validation", { sequential: true }, () => {
  let db: Database.Database;

  beforeAll(async () => {
    // const { db: testDb } = initDb(TEST_DB_PATH, true);
    // await setupDb(testDb);
    const dbResult = initDb(TEST_DB_PATH);
    db = dbResult.db;
  });

  afterAll(() => {
    db.close();
  });

  it("Drizzle schema should match table in the DB", () => {
    const drizzleTables = Object.keys(schema);

    // const drizzleTable = schema[drizzleTables[0] as keyof typeof schema]
    // console.log("drizzle table - ", getTableConfig(drizzleTable).name)
    // expect(drizzleTables.length).toBe(3);
    drizzleTables.forEach((t) => {
      const drizzleTableObject = schema[t as keyof typeof schema];
      const { name, columns } = getTableConfig(drizzleTableObject);
      const columnsInDb = db.prepare(`PRAGMA table_info(${name})`).all() as ColumnInfo[];
      const columnsInDbNames = columnsInDb.map((c) => c.name);
      const drizzletableColumns = columns.map((c) => c.name);
      // Find columns that exist only in DB
      const onlyInDb = columnsInDbNames.filter((col) => !drizzletableColumns.includes(col));
      // Find columns that exist only in Drizzle
      const onlyInDrizzle = drizzletableColumns.filter((col) => !columnsInDbNames.includes(col));
      // console.log("\n=============", name, "=============");
      // console.log("Columns only in DB:", onlyInDb);
      // console.log("Columns only in Drizzle:", onlyInDrizzle);
      // console.log("=============", name, "=============\n");
      expect(onlyInDb.length).toBe(0);
      expect(onlyInDrizzle.length).toBe(0)
      expect(columnsInDb.length).toBe(columns.length);
    });
  });
});
