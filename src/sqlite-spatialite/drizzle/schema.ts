import { sqliteTable, integer, text, blob, real } from "drizzle-orm/sqlite-core";
import { type InferSelectModel, sql } from "drizzle-orm";
import { multiPolygon } from "./custom-spatialite-types.js";

export const kenyaWards = sqliteTable("kenya_wards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wardCode: text("ward_code"),
  ward: text("ward").notNull(),
  county: text("county").notNull(),
  countyCode: integer("county_code"),
  subCounty: text("sub_county"),
  constituency: text("constituency").notNull(),
  constituencyCode: integer("constituency_code"),

  // ✅ Use REAL for bounding box — matches SQLite column type
  minX: real("minx"),
  minY: real("miny"),
  maxX: real("maxx"),
  maxY: real("maxy"),

  // ✅ Use BLOB for geometry — Spatialite stores WKB as BLOB
  geom: multiPolygon("geom"), // ← this is correct for WKB geometry
});

export const country = sqliteTable("kenya_country", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shapeName: text("shape_name").notNull(),
  shapeIso: text("shape_iso").notNull(),
  shapeId: text("shape_id"),
  shapeGroup: text("shape_group"),
  shapeType: text("shape_type"),
  geom: multiPolygon("geom"), // ← WKB geometry for country borders
});

export const wardEvents = sqliteTable("kenya_ward_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventType: text("event_type", { enum: ["INSERT", "UPDATE", "DELETE"] }).notNull(),
  wardId: integer("ward_id"), // NULL for INSERT events (before ID assigned)
  wardCode: text("ward_code"), // For tracking even when ID changes
  oldData: text("old_data"), // JSON of previous row data (NULL for INSERT)
  newData: text("new_data"), // JSON of new row data (NULL for DELETE)
  timestamp: text("timestamp").notNull().default(sql`CURRENT_TIMESTAMP`),
  syncStatus: text("sync_status", { enum: ["PENDING", "SYNCED", "FAILED"] }).notNull().default("PENDING"),
  syncAttempts: integer("sync_attempts").notNull().default(0),
  lastSyncAttempt: text("last_sync_attempt"),
  errorMessage: text("error_message"),
  clientId: text("client_id"), // Identifies which client created the event
});

// Infer the select types
export type KenyaWardsSelect = InferSelectModel<typeof kenyaWards>;
export type CountrySelect = InferSelectModel<typeof country>;
export type WardEventsSelect = InferSelectModel<typeof wardEvents>;
