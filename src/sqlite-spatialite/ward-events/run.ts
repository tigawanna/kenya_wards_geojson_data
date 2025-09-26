import { initDb } from "../lib/client.js";
import { createWardEventsTable } from "./create_kenya_ward_events.js";

createWardEventsTable(initDb("test/test_cretea_events").db)
.catch((e)=>console.error(e))
