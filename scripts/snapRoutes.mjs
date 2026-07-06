import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const DEFAULT_INPUT_FILE = "src/data/mapua_makati_geojson_routes.geojson";
const DEFAULT_OUTPUT_FILE = "src/data/mapua_makati_geojson_routes_snapped.geojson";
const OSRM_MATCH_URL = "https://router.project-osrm.org/match/v1/driving";
const REQUEST_DELAY_MS = 1000;
const MAX_MATCH_COORDINATES = 100;

function getArgValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || !process.argv[index + 1]) return fallback;
  return process.argv[index + 1];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function routeLabel(feature) {
  return feature.properties?.name || feature.properties?.id || "Unnamed route";
}

function isRouteLine(feature) {
  const featureType = String(feature.properties?.feature_type || feature.properties?.type || "").toLowerCase();
  return feature.geometry?.type === "LineString" && (!featureType || featureType === "route");
}

function downsampleCoordinates(coords) {
  if (coords.length <= MAX_MATCH_COORDINATES) return coords;

  const sampled = [];
  const lastIndex = coords.length - 1;
  for (let i = 0; i < MAX_MATCH_COORDINATES; i += 1) {
    const sourceIndex = Math.round((i / (MAX_MATCH_COORDINATES - 1)) * lastIndex);
    sampled.push(coords[sourceIndex]);
  }
  return sampled;
}

async function snapFeature(feature) {
  const coords = feature.geometry.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    return { snapped: false, reason: "not enough coordinates" };
  }

  const osrmCoords = downsampleCoordinates(coords);
  const coordString = osrmCoords.map(([lon, lat]) => `${lon},${lat}`).join(";");
  const url = `${OSRM_MATCH_URL}/${coordString}?geometries=geojson&overview=full`;

  const response = await fetch(url);
  if (!response.ok) {
    return { snapped: false, reason: `HTTP ${response.status}` };
  }

  const data = await response.json();
  if (data.code !== "Ok" || !data.matchings?.length) {
    return { snapped: false, reason: data.code || "no matchings returned" };
  }

  feature.geometry.coordinates = data.matchings[0].geometry.coordinates;
  feature.properties = {
    ...feature.properties,
    snapped_by: "OSRM match v1 driving",
    snapped_at: new Date().toISOString(),
  };

  return { snapped: true };
}

async function snapRoutes() {
  const inputFile = path.resolve(ROOT_DIR, getArgValue("--input", DEFAULT_INPUT_FILE));
  const outputFile = path.resolve(ROOT_DIR, getArgValue("--output", DEFAULT_OUTPUT_FILE));

  console.log(`Reading routes from ${path.relative(ROOT_DIR, inputFile)}`);
  const rawData = fs.readFileSync(inputFile, "utf-8");
  const geojson = JSON.parse(rawData);

  if (!Array.isArray(geojson.features)) {
    throw new Error("Input file is not a GeoJSON FeatureCollection with a features array.");
  }

  const routeFeatures = geojson.features.filter(isRouteLine);
  console.log(`Found ${routeFeatures.length} route LineString feature(s).`);

  let successCount = 0;
  let skippedCount = 0;

  for (const feature of routeFeatures) {
    const label = routeLabel(feature);
    console.log(`Snapping ${label}`);

    try {
      const result = await snapFeature(feature);
      if (result.snapped) {
        successCount += 1;
        console.log(`Snapped ${label}`);
      } else {
        skippedCount += 1;
        console.warn(`Kept original ${label}: ${result.reason}`);
      }
    } catch (error) {
      skippedCount += 1;
      console.warn(`Kept original ${label}: ${error instanceof Error ? error.message : String(error)}`);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(geojson, null, 2)}\n`);

  console.log(`Saved snapped GeoJSON to ${path.relative(ROOT_DIR, outputFile)}`);
  console.log(`Complete. Snapped: ${successCount}. Kept original: ${skippedCount}.`);
}

snapRoutes().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
