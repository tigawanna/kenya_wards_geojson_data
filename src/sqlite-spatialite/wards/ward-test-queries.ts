import { initDb } from "../lib/client.js";
import {
  findWardSmart,
  findWardsWithinDistance,
  findWardsByCounty,
  findWardsInBoundingBox,
  findWardByPointOptimized,
  findWardSmartOptimized,
  findWardsInBoundingBoxOptimized,
  getWardsByCodesOptimized,
  calculateCombinedBBox,
} from "./ward-query-helpers.js";

async function main() {
  const { db } = await initDb();

  console.log("Testing spatial queries...\\n");

  // Nairobi test
  const [nairobiLat, nairobiLng] = [-1.286389, 36.817223];
  const nairobiPoint = findWardSmart(db, nairobiLat, nairobiLng);
  if (nairobiPoint) {
    const {geometry,...ward} = nairobiPoint;
    console.log("NAIROBI", ward);
  }

  // Kiambu test
  const [kiambuLat, kiambuLng] = [-1.16972893282049, 36.82946781044468];
  const kiambuPoint = findWardSmart(db, kiambuLat, kiambuLng);

  if (kiambuPoint) {
    const {geometry,...ward} = kiambuPoint;
    console.log("\\nKIAMBU", ward);
  }

  // Kalama test
  const [kalamaLat, kalamaLng] = [-1.6725405427262028, 37.25285675999058];
  const kalamaPoint = findWardSmart(db, kalamaLat, kalamaLng);

  if (kalamaPoint) {
    const {geometry,...ward} = kalamaPoint;
    console.log("\\nKALAMA", ward);
  }

  // Machakos test
  const [machakosLat, machakosLng] = [-0.8540481379611513, 37.69510191590412];
  const machakosPoint = findWardSmart(db, machakosLat, machakosLng);

  if (machakosPoint) {
    const {geometry,...ward} = machakosPoint;
    console.log("\\nMACHAKOS", ward);
  }

  // Wards within distance test
  const nearbyWards = findWardsWithinDistance(db, kiambuLat, kiambuLng, 2000);
  console.log("\\nWARDS WITHIN 2000m", `Found ${nearbyWards.length} wards`);

  // County wards test
  const nairobiWards = findWardsByCounty(db, "Nairobi");
  console.log("\\nNAIROBI WARDS", `Found ${nairobiWards.length} wards`);

  // Bounding box test
  const bboxWards = findWardsInBoundingBox(db, -1.35, 36.7, -1.2, 36.9);
  console.log("\\nBOUNDING BOX", `Found ${bboxWards.length} wards`);
}

main()
  .then(() => {
    console.log("\\nAll queries executed successfully.");
  })
  .catch((error) => {
    console.error("\\nError in main execution:", error);
  });

  