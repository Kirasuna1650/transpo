import routesCsv from "../../data/mapua_makati_final_road_following_route_audit.csv?raw";
import routesGeoJsonRaw from "../../data/puv_commuter_geolocator_routes.geojson?raw";
import type { Vehicle, VehicleType, CapacityLevel } from "../App";

type GeoJsonLineFeature = {
  type: "Feature";
  properties: {
    id: string;
    type: string;
    mode: string;
    name: string;
    color?: string;
    line?: string;
  };
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
};

type GeoJsonPointFeature = {
  type: "Feature";
  properties: {
    id: string;
    type: string;
    mode: string;
    name: string;
    crowd_level?: string;
    waiting_commuters_mock?: number;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};

type GeoJsonFeature = GeoJsonLineFeature | GeoJsonPointFeature;

interface RouteCsvRow {
  id: string;
  name: string;
  puv_type: string;
  feature_type: string;
  waypoints: string;
  source: string;
}

interface LegacyRouteCsvRow {
  id: string;
  mode?: string;
  name: string;
  waypoints: string;
  status?: string;
}

export interface TransitRoute {
  id: string;
  mode: string;
  vehicleType: VehicleType;
  name: string;
  waypoints: string[];
  status: string;
  coordinates: [number, number][];
}

export interface TransitStop {
  id: string;
  mode: string;
  name: string;
  crowdLevel: string;
  waitingCommuters: number;
  coordinates: [number, number];
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(value);
      value = "";
    } else {
      value += char;
    }
  }

  cells.push(value);
  return cells;
}

function parseRoutesCsv(csv: string): RouteCsvRow[] {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine);

  return lines.map((line) => {
    const cells = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header as keyof RouteCsvRow] = cells[index] ?? "";
      return row;
    }, {} as RouteCsvRow);
  });
}

function toVehicleType(mode: string): VehicleType {
  const normalized = mode.toLowerCase();
  if (normalized.includes("bus")) return "bus";
  if (normalized.includes("train") || normalized.includes("lrt") || normalized.includes("mrt")) return "train";
  if (normalized.includes("uv")) return "uvexpress";
  return "jeepney";
}

function vehicleLabel(type: VehicleType) {
  if (type === "bus") return "BUS";
  if (type === "train") return "MRT";
  if (type === "uvexpress") return "UV";
  return "PUJ";
}

function capacityForIndex(index: number): CapacityLevel {
  return index % 5 === 0 ? "full" : index % 3 === 0 ? "limited" : "available";
}

function occupancyFor(capacity: CapacityLevel, max: number) {
  if (capacity === "full") return max;
  if (capacity === "limited") return Math.round(max * 0.76);
  return Math.round(max * 0.42);
}

const csvRows = parseRoutesCsv(routesCsv);
const csvById = new Map(csvRows.map((row) => [row.id, row]));
const geoJson = JSON.parse(routesGeoJsonRaw) as { features: GeoJsonFeature[] };
const geoRoutesById = new Map(
  geoJson.features
    .filter((feature): feature is GeoJsonLineFeature => (
      feature.properties?.type === "route" && feature.geometry?.type === "LineString"
    ))
    .map((feature) => [feature.properties.id, feature])
);

function waypointsFromName(name: string) {
  return name.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
}

function waypointsFromCsv(row: LegacyRouteCsvRow) {
  if (!row.waypoints) return waypointsFromName(row.name);
  if (/^\d+$/.test(row.waypoints.trim())) return waypointsFromName(row.name);
  return row.waypoints.split(">").map((part) => part.trim()).filter(Boolean);
}

export const ROUTES: TransitRoute[] = csvRows
  .filter((row) => !row.feature_type || row.feature_type.toLowerCase() === "route")
  .map((row) => {
    const feature = geoRoutesById.get(row.id);
    const mode = row.puv_type || feature?.properties.mode || "Jeepney";
    return {
      id: row.id,
      mode,
      vehicleType: toVehicleType(mode),
      name: row.name || feature?.properties.name || row.id,
      waypoints: waypointsFromCsv(row),
      status: row.source || "local csv",
      coordinates: feature?.geometry.coordinates || [],
    };
  });

export const STOPS: TransitStop[] = geoJson.features
  .filter((feature): feature is GeoJsonPointFeature => (
    feature.properties?.type === "stop" && feature.geometry?.type === "Point"
  ))
  .map((feature) => ({
    id: feature.properties.id,
    mode: feature.properties.mode,
    name: feature.properties.name,
    crowdLevel: feature.properties.crowd_level || "Crowd data pending",
    waitingCommuters: feature.properties.waiting_commuters_mock || 0,
    coordinates: feature.geometry.coordinates,
  }));

export const ROUTES_BY_ID = new Map(ROUTES.map((route) => [route.id, route]));

export const ROUTE_VEHICLES: Vehicle[] = ROUTES.map((route, index) => {
  const capacity = capacityForIndex(index);
  const maxOccupancy = route.vehicleType === "train" ? 380 : route.vehicleType === "bus" ? 45 : route.vehicleType === "uvexpress" ? 10 : 16;
  return {
    id: route.id,
    type: route.vehicleType,
    routeName: route.name,
    plateNo: `${vehicleLabel(route.vehicleType)}-${String(index + 1).padStart(4, "0")}`,
    capacity,
    eta: 3 + (index % 10),
    distance: `${(0.4 + (index % 9) * 0.3).toFixed(1)} km`,
    occupancy: occupancyFor(capacity, maxOccupancy),
    maxOccupancy,
    stops: route.waypoints.length > 1 ? route.waypoints : [route.name],
    currentStop: Math.min(1, Math.max(0, route.waypoints.length - 1)),
    emoji: vehicleLabel(route.vehicleType),
  };
});

export const POPULAR_ROUTE_PAIRS = ROUTES.filter((route) => route.waypoints.length >= 2)
  .slice(0, 10)
  .map((route) => ({
    routeId: route.id,
    from: route.waypoints[0],
    to: route.waypoints[route.waypoints.length - 1],
  }));
