import { SUB_COUNTY_MAPPINGS } from "../data/sub_county.js";
import { WARDS_GEOJSON } from "../data/wards_geojson.js";
import { db } from "./lib/client.js";
import { kenyaWards } from "./lib/schema.js";



const getSubCounty = (ward: string): string | null => {
  const subCounty = SUB_COUNTY_MAPPINGS.find((item) => {
    const subCounties = Object.values(item.sub_counties).flat();
    const found = subCounties.some((subCountyWard) =>
      subCountyWard.toLowerCase().includes(ward.toLowerCase())
    );

    return found;
  });

  if (subCounty) {
    return subCounty.county_name;
  }
  return null;
};

const wards = WARDS_GEOJSON.features.map((feature) => {
  return {
    id: feature.properties.id,
    ward: feature.properties.ward,
    wardCode: feature.properties.wardcode,
    county: feature.properties.county,
    countyCode: feature.properties.countycode,
    subCounty: SUB_COUNTY_MAPPINGS,
    constituency: feature.properties.const,
    constituencyCode: feature.properties.constcode,
    coodinates: feature.geometry.coordinates,
  };
});

async function insertWards() {
  const wardsWithSubCounties = wards.map((ward) => {
    const subCounty = getSubCounty(ward.ward);
    const { coodinates, ...excWard } = ward;

    // Create the GeoJSON structure for MultiPolygon
    const geometry = {
      type: "MultiPolygon",
      coordinates: coodinates, // Maintain the [][][][] structure
    };

    return {
      ...excWard,
      id: parseInt(ward.id, 10),
      countyCode: ward.countyCode ? ward.countyCode : -1,
      constituencyCode: ward.constituencyCode ? ward.constituencyCode : -1,
      subCounty: subCounty || "Unknown",
      // Store the geometry as GeoJSON text - will convert to PostGIS geometry in insert
      geometry: JSON.stringify(geometry),
    };
  });

  await db.insert(kenyaWards).values(wardsWithSubCounties);
}

