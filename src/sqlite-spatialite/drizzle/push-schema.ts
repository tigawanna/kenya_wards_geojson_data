import { createRequire } from "node:module";
import type * as DrizzleKit from "drizzle-kit/api";
import * as schema from "../schema.js";
import { drizzleDb } from "./client.js";
import { getTableConfig, SQLiteColumn } from "drizzle-orm/sqlite-core";

function tableToSql(table: any): string {
  console.log("\n");
  const config = getTableConfig(table);
  const columns = config.columns
    .map((col) => {
      // console.log("col column type ==", col.columnType)
      if (col.name === "geom"){
        console.log(
          "col data type ==",
          col.columnType
        );

      }
      let sql = `\`${col.name}\` ${col.getSQLType()}`;
      if (col.primary) sql += " PRIMARY KEY";
      if (col.notNull) sql += " NOT NULL";
      if (col.default !== undefined) sql += ` DEFAULT ${col.default}`;
      return sql;
    })
    .join(",\n  ");

  return `CREATE TABLE IF NOT EXISTS \`${config.name}\` (\n  ${columns}\n);`;
}

// workaround for https://github.com/drizzle-team/drizzle-orm/issues/3913
async function pushUwuSchema() {
  console.log("\n", tableToSql(schema.kenyaWards));
}

pushUwuSchema().catch(console.error);
