import { serial, varchar } from "drizzle-orm/pg-core";
import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";
import { multiPolygon } from "./postgis-types.js";
// Custom PostGIS types (workaround for Drizzle geometry bug)

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
    geometry: multiPolygon("geometry").notNull(),
  },
  (t) => [index("kenya_wards_geometry_gix").using("gist", t.geometry)]
);
