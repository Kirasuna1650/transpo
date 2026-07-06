import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_ROUTE_FILE = "./src/data/Final.geojson";
const TICK_MS = 3000;

const VEHICLE_SEAT_LIMITS = {
  jeepney: 18,
  uvexpress: 14,
  bus: 55,
  train: 1000,
};

const VEHICLES_PER_ROUTE = {
  jeepney: 10,
  bus: 10,
  uvexpress: 5,
  train: 10,
};

const MOVE_EVERY_TICKS = {
  jeepney: 3,
  bus: 4,
  uvexpress: 4,
  train: 3,
};

const HOTSPOT_TICK_MS = 5000;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  });
}

function loadLocalEnv() {
  [".env.local", ".env"].forEach((fileName) => loadEnvFile(path.resolve(process.cwd(), fileName)));
}

function getSupabaseConfig() {
  loadLocalEnv();

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const key = serviceRoleKey || anonKey;

  if (!url || !key) {
    throw new Error("Missing VITE_SUPABASE_URL plus SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY in .env.local.");
  }

  return { url, key, usesServiceRole: Boolean(serviceRoleKey) };
}

function normalizeVehicleType(feature) {
  const rawType = String(feature.properties?.puv_type || feature.properties?.mode || feature.properties?.type || "").toLowerCase();
  if (rawType.includes("bus")) return "bus";
  if (rawType.includes("uv")) return "uvexpress";
  if (rawType.includes("train") || rawType.includes("rail") || rawType.includes("lrt") || rawType.includes("mrt")) return "train";
  return "jeepney";
}

function randomSeatDelta() {
  const direction = Math.random() > 0.5 ? 1 : -1;
  return direction * (1 + Math.floor(Math.random() * 3));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function uuidFromString(value) {
  const bytes = crypto.createHash("sha1").update(value).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

function routeLabel(feature, index) {
  return feature.properties?.display_name || feature.properties?.name || `Simulated route ${index + 1}`;
}

function featureKind(feature) {
  return String(feature.properties?.feature_type || feature.properties?.type || "").toLowerCase();
}

function loadRouteData() {
  const routeFile = process.env.SIM_ROUTE_FILE || DEFAULT_ROUTE_FILE;
  const absoluteRouteFile = path.resolve(process.cwd(), routeFile);

  if (!fs.existsSync(absoluteRouteFile)) {
    throw new Error(`Route file not found: ${absoluteRouteFile}`);
  }

  return JSON.parse(fs.readFileSync(absoluteRouteFile, "utf8"));
}

function createFleet(routeData) {
  return routeData.features
    .filter((feature) => feature.geometry?.type === "LineString" && Array.isArray(feature.geometry.coordinates))
    .flatMap((feature, routeIndex) => {
      const vehicleType = normalizeVehicleType(feature);
      const maxSeats = VEHICLE_SEAT_LIMITS[vehicleType];
      const pathCoordinates = feature.geometry.coordinates.filter((coordinate) => (
        Array.isArray(coordinate) &&
        Number.isFinite(coordinate[0]) &&
        Number.isFinite(coordinate[1])
      ));
      const routeId = String(feature.properties?.id || `route-${routeIndex}`);
      const vehicleCount = VEHICLES_PER_ROUTE[vehicleType];

      return Array.from({ length: vehicleCount }, (_, vehicleIndex) => {
        const startIndex = pathCoordinates.length
          ? Math.floor((pathCoordinates.length * vehicleIndex) / vehicleCount)
          : 0;

        return {
          id: uuidFromString(`transpo-sim-vehicle:${routeId}:${routeIndex}:${vehicleIndex}`),
          routeId,
          label: `Simulated ${vehicleType} ${vehicleIndex + 1} - ${routeLabel(feature, routeIndex)}`,
          vehicleType,
          path: pathCoordinates,
          currentIndex: startIndex,
          tickOffset: vehicleIndex % MOVE_EVERY_TICKS[vehicleType],
          availableSeats: clamp(
            Math.round(maxSeats * (0.35 + Math.random() * 0.35)),
            0,
            maxSeats
          ),
        };
      });
    })
    .filter((vehicle) => vehicle.path.length > 0);
}

function createHotspots(routeData) {
  return routeData.features
    .filter((feature) => feature.geometry?.type === "Point" && featureKind(feature) === "stop_point")
    .filter((feature) => ["bus", "train"].includes(normalizeVehicleType(feature)))
    .map((feature, index) => {
      const vehicleType = normalizeVehicleType(feature);
      return {
        id: String(feature.properties?.id || feature.properties?.stop_id || `stop-${index}`),
        routeId: String(feature.properties?.route_id || ""),
        label: String(feature.properties?.name || feature.properties?.stop_name || `Stop ${index + 1}`),
        vehicleType,
        waitingCommuters: Math.floor(Math.random() * (vehicleType === "train" ? 120 : 65)),
      };
    });
}

function severityFor(waitingCommuters) {
  if (waitingCommuters > 300) return "critical";
  if (waitingCommuters > 150) return "high";
  if (waitingCommuters > 50) return "moderate";
  return "low";
}

function buildHotspotUpdate(stop) {
  const crowdChange = Math.floor(Math.random() * 35) - 15;
  stop.waitingCommuters = clamp(stop.waitingCommuters + crowdChange, 0, 500);

  return {
    id: stop.id,
    route_id: stop.routeId,
    label: stop.label,
    mode: stop.vehicleType,
    crowd_level: severityFor(stop.waitingCommuters),
    waiting_commuters: stop.waitingCommuters,
    last_updated: new Date().toISOString(),
  };
}

function buildUpdate(vehicle, tickCount) {
  const coordinate = vehicle.path[vehicle.currentIndex];
  const maxSeats = VEHICLE_SEAT_LIMITS[vehicle.vehicleType];
  const shouldMove = (tickCount + vehicle.tickOffset) % MOVE_EVERY_TICKS[vehicle.vehicleType] === 0;

  if (shouldMove) {
    vehicle.currentIndex = (vehicle.currentIndex + 1) % vehicle.path.length;
  }
  vehicle.availableSeats = clamp(vehicle.availableSeats + randomSeatDelta(), 0, maxSeats);

  return {
    id: vehicle.id,
    route_id: vehicle.routeId,
    label: vehicle.label,
    latitude: coordinate[1],
    longitude: coordinate[0],
    last_seen_at: new Date().toISOString(),
    metadata: {
      simulated: true,
      vehicle_type: vehicle.vehicleType,
      available_seats: vehicle.availableSeats,
      max_seats: maxSeats,
      coordinate_index: vehicle.currentIndex,
      path_length: vehicle.path.length,
      move_every_ticks: MOVE_EVERY_TICKS[vehicle.vehicleType],
    },
  };
}

async function main() {
  const { url, key, usesServiceRole } = getSupabaseConfig();
  const supabase = createClient(url, key);
  const routeData = loadRouteData();
  const fleet = createFleet(routeData);
  const hotspots = createHotspots(routeData);

  if (!fleet.length) {
    throw new Error("No LineString routes were found in the GeoJSON file.");
  }

  console.log(`Spawned ${fleet.length} simulated vehicles.`);
  console.log(`Spawned ${hotspots.length} monitored stop hotspots.`);
  console.log(`Fleet mix: ${Object.entries(VEHICLES_PER_ROUTE).map(([type, count]) => `${count} ${type}/route`).join(", ")}.`);
  console.log(`Supabase key mode: ${usesServiceRole ? "service role" : "anon key"}.`);
  if (!usesServiceRole) {
    console.log("Anon key mode requires INSERT/UPDATE RLS policies for public.vehicles.");
  }
  console.log("Press Ctrl+C to stop the simulation.");

  let tickCount = 0;

  async function tick() {
    tickCount += 1;
    const updates = fleet.map((vehicle) => buildUpdate(vehicle, tickCount));
    const { error } = await supabase.from("vehicles").upsert(updates, { onConflict: "id" });

    if (error) {
      console.error(`Vehicle update failed: ${error.message}`);
      return;
    }

    console.log(`Tick ${new Date().toLocaleTimeString()}: updated ${updates.length} vehicles.`);
  }

  async function hotspotTick() {
    if (!hotspots.length) return;

    const updates = hotspots.map(buildHotspotUpdate);
    const { error } = await supabase.from("live_stops").upsert(updates, { onConflict: "id" });

    if (error) {
      console.error(`Hotspot update failed: ${error.message}`);
      return;
    }

    console.log(`Hotspot ${new Date().toLocaleTimeString()}: updated ${updates.length} stops.`);
  }

  await tick();
  await hotspotTick();
  setInterval(() => {
    void tick();
  }, TICK_MS);
  setInterval(() => {
    void hotspotTick();
  }, HOTSPOT_TICK_MS);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
