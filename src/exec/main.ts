import { createQueryBuilder } from "@/sqlite-spatialite/query-builder/query-builder.js";
import {
  exampleReactNativeUsage,
  testQueryBuilderSQL,
} from "@/sqlite-spatialite/query-builder/sql-output.js";
import { kenyaWards } from "@/sqlite-spatialite/query-builder/schema.js";
import { sql } from "drizzle-orm";

async function main() {
  const basicQuery = createQueryBuilder(kenyaWards).select({
    id: sql`id`,
    ward: sql`ward`,
    county: sql`county`,
  });
  console.log('Basic Query SQL: === ',basicQuery.toSQL());
}

main()
.catch((e) => {
  console.error(e);
  process.exit(1);
}   )
