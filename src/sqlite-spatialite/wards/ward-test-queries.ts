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
  calculateCombinedBBox
} from "./ward-query-helpers.js";

async function main() {
  const { db } = await initDb();
  const { db: optz_db } = initDb();
  
  console.log("Testing spatial queries...\\n");
  
  // Nairobi test
  const [nairobiLat, nairobiLng] = [-1.286389, 36.817223];
  const nairobiPoint = findWardSmart(db, nairobiLat, nairobiLng);
  const nairobiPointOptz = findWardSmart(optz_db, nairobiLat, nairobiLng);
  console.log("NAIROBI - Regular DB:", {
    county: nairobiPoint?.county,
    constituency: nairobiPoint?.constituency,
    ward: nairobiPoint?.ward,
  });
  console.log("NAIROBI - Optimized DB:", {
    county: nairobiPointOptz?.county,
    constituency: nairobiPointOptz?.constituency,
    ward: nairobiPointOptz?.ward,
  });

  // Kiambu test
  const [kiambuLat, kiambuLng] = [-1.16972893282049, 36.82946781044468];
  const kiambuPoint = findWardSmart(db, kiambuLat, kiambuLng);
  const kiambuPointOptz = findWardSmart(optz_db, kiambuLat, kiambuLng);
  console.log("\\nKIAMBU - Regular DB:", {
    county: kiambuPoint?.county,
    constituency: kiambuPoint?.constituency,
    ward: kiambuPoint?.ward,
  });
  console.log("KIAMBU - Optimized DB:", {
    county: kiambuPointOptz?.county,
    constituency: kiambuPointOptz?.constituency,
    ward: kiambuPointOptz?.ward,
  });

  // Kalama test
  const [kalamaLat, kalamaLng] = [-1.6725405427262028, 37.25285675999058];
  const kalamaPoint = findWardSmart(db, kalamaLat, kalamaLng);
  const kalamaPointOptz = findWardSmart(optz_db, kalamaLat, kalamaLng);
  console.log("\\nKALAMA - Regular DB:", {
    county: kalamaPoint?.county,
    constituency: kalamaPoint?.constituency,
    ward: kalamaPoint?.ward,
  });
  console.log("KALAMA - Optimized DB:", {
    county: kalamaPointOptz?.county,
    constituency: kalamaPointOptz?.constituency,
    ward: kalamaPointOptz?.ward,
  });

  // Machakos test
  const [machakosLat, machakosLng] = [-0.8540481379611513, 37.69510191590412];
  const machakosPoint = findWardSmart(db, machakosLat, machakosLng);
  const machakosPointOptz = findWardSmart(optz_db, machakosLat, machakosLng);
  console.log("\\nMACHAKOS - Regular DB:", {
    county: machakosPoint?.county,
    constituency: machakosPoint?.constituency,
    ward: machakosPoint?.ward,
  });
  console.log("MACHAKOS - Optimized DB:", {
    county: machakosPointOptz?.county,
    constituency: machakosPointOptz?.constituency,
    ward: machakosPointOptz?.ward,
  });

  // Wards within distance test
  const nearbyWards = findWardsWithinDistance(db, kiambuLat, kiambuLng, 2000);
  const nearbyWardsOptz = findWardsWithinDistance(optz_db, kiambuLat, kiambuLng, 2000);
  console.log("\\nWARDS WITHIN 2000m - Regular DB:", `Found ${nearbyWards.length} wards`);
  console.log("WARDS WITHIN 2000m - Optimized DB:", `Found ${nearbyWardsOptz.length} wards`);

  // County wards test
  const nairobiWards = findWardsByCounty(db, "Nairobi");
  const nairobiWardsOptz = findWardsByCounty(optz_db, "Nairobi");
  console.log("\\nNAIROBI WARDS - Regular DB:", `Found ${nairobiWards.length} wards`);
  console.log("NAIROBI WARDS - Optimized DB:", `Found ${nairobiWardsOptz.length} wards`);

  // Bounding box test
  const bboxWards = findWardsInBoundingBox(db, -1.35, 36.7, -1.2, 36.9);
  const bboxWardsOptz = findWardsInBoundingBox(optz_db, -1.35, 36.7, -1.2, 36.9);
  console.log("\\nBOUNDING BOX - Regular DB:", `Found ${bboxWards.length} wards`);
  console.log("BOUNDING BOX - Optimized DB:", `Found ${bboxWardsOptz.length} wards`);

  console.log("\\n=== OPTIMIZED QUERIES COMPARISON ===");
  
  // Test optimized point queries
  const nairobiOptimized = findWardByPointOptimized(optz_db, nairobiLat, nairobiLng);
  const kiambuOptimized = findWardByPointOptimized(optz_db, kiambuLat, kiambuLng);
  console.log("\\nOPTIMIZED POINT QUERIES:");
  console.log("Nairobi:", nairobiOptimized?.ward);
  console.log("Kiambu:", kiambuOptimized?.ward);
  
  // Test optimized bbox calculation
  const testWards = getWardsByCodesOptimized(optz_db, ['001001', '001002']);
  const bbox = calculateCombinedBBox(testWards);
  console.log("\\nOPTIMIZED BBOX (no geometry parsing):", bbox);
  
  // Test optimized bounding box query
  const bboxOptimized = findWardsInBoundingBoxOptimized(optz_db, -1.35, 36.7, -1.2, 36.9);
  console.log("\\nOPTIMIZED BBOX QUERY:", `Found ${bboxOptimized.length} wards`);

  console.log("\\nDatabase queries complete.");
}

main()
  .then(() => {
    console.log("\\nAll queries executed successfully.");
  })
  .catch((error) => {
    console.error("\\nError in main execution:", error);
  });
