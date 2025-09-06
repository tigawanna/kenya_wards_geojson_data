import { SQLITE_DB_PATH } from "@/constants.js";
import Database from "better-sqlite3";
import type { Database as BetterSqlite3Database } from "better-sqlite3";


const db = new Database(SQLITE_DB_PATH);
db.loadExtension("mod_spatialite");


export function getDB(): BetterSqlite3Database {
  return db;
}

export function initDB() {
  // Create tables if they don't exist
  // This is just an example, you should put your own schema.
  const createTablesStatement = `
        CREATE TABLE IF NOT EXISTS wards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            geom BLOB
        );
    `;
  db.exec(createTablesStatement);
}
