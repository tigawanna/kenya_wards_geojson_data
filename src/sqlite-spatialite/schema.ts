import { sqliteTable, integer, text, blob, real } from "drizzle-orm/sqlite-core";
import { type InferSelectModel, sql } from "drizzle-orm";

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
  geom: blob("geom"), // ← this is correct for WKB geometry
});

export const country = sqliteTable("country", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shapeName: text("shape_name").notNull(),
  shapeIso: text("shape_iso").notNull(),
  shapeId: text("shape_id"),
  shapeGroup: text("shape_group"),
  shapeType: text("shape_type"),
  geom: blob("geom"), // ← WKB geometry for country borders
});

// Infer the select types
export type KenyaWardsSelect = InferSelectModel<typeof kenyaWards>;
export type CountrySelect = InferSelectModel<typeof country>;
