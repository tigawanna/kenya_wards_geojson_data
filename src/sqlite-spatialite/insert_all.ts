import { insertWards } from "./wards/insert_wards.js";
import { insertCountry } from "./country/insert-country.js";



async function main() {
  await insertCountry();
  await insertWards();
}

main().catch(console.error)
