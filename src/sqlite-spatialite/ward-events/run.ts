import { initDb } from "../lib/client.js";
import { createWardEventsTable } from "./create_kenya_ward_events.js";

async function main() {
  const createDb = initDb("test/test_cretea_events").db;  
  await createWardEventsTable(createDb);
  createDb.close();
  const db = initDb("test/test_cretea_events").db;
  const columns = db.prepare("PRAGMA table_info(kenya_ward_events)").all() as any[];
  const columnNames = columns.map((c) => c.name);
  console.log("Columns:", columnNames);
}

main().catch((e) => console.error(e));
