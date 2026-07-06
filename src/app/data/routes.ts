import routesCsv from "../../data/mapua_makati_final_road_following_route_audit.csv?raw";
import routesGeoJsonRaw from "../../data/Final.geojson?raw";
import type { Vehicle, VehicleType, CapacityLevel } from "../App";

type GeoJsonLineFeature = {
  type: "Feature";
  properties: {
    id: string;
    type?: string;
    feature_type?: string;
    mode?: string;
    puv_type?: string;
    name: string;
    display_name?: string;
    color?: string;
    line?: string;
    source?: string;
  };
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
};

type GeoJsonPointFeature = {
  type: "Feature";
  properties: {
    id?: string;
    type?: string;
    feature_type?: string;
    mode?: string;
    puv_type?: string;
    name: string;
    display_name?: string;
    route_id?: string;
    stop_id?: string;
    "marker-color"?: string;
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
  routeId?: string;
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
  if (normalized.includes("train") || normalized.includes("rail") || normalized.includes("lrt") || normalized.includes("mrt")) return "train";
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
const csvByName = new Map(csvRows.map((row) => [normalizeRouteName(row.name), row]));
const geoJson = JSON.parse(routesGeoJsonRaw) as { features: GeoJsonFeature[] };

function featureKind(feature: GeoJsonFeature) {
  return (feature.properties.feature_type || feature.properties.type || "").toLowerCase();
}

function featureMode(feature: GeoJsonFeature) {
  return feature.properties.puv_type || feature.properties.mode || "";
}

function normalizeRouteName(name: string) {
  return name
    .toLowerCase()
    .replace(/\bpaterros\b/g, "pateros")
    .replace(/\bbel-air\b/g, "bel-air")
    .replace(/\bgate2\b/g, "gate 2")
    .replace(/\s+/g, " ")
    .trim();
}

const geoRouteFeatures = geoJson.features.filter((feature): feature is GeoJsonLineFeature => (
  ["route", "route_line"].includes(featureKind(feature)) && feature.geometry?.type === "LineString"
));

function waypointsFromName(name: string) {
  return name.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
}

function waypointsFromCsv(row: LegacyRouteCsvRow) {
  if (!row.waypoints) return waypointsFromName(row.name);
  if (/^\d+$/.test(row.waypoints.trim())) return waypointsFromName(row.name);
  return row.waypoints.split(">").map((part) => part.trim()).filter(Boolean);
}

export const ROUTES: TransitRoute[] = geoRouteFeatures
  .map((feature) => {
    const featureId = feature.properties.id || feature.properties.name;
    const displayName = feature.properties.display_name || feature.properties.name;
    const csvRow = csvByName.get(normalizeRouteName(displayName)) || csvById.get(featureId);
    const mode = featureMode(feature) || csvRow?.puv_type || "Jeepney";
    return {
      id: featureId,
      mode,
      vehicleType: toVehicleType(mode),
      name: displayName || csvRow?.name || featureId,
      waypoints: csvRow ? waypointsFromCsv(csvRow) : waypointsFromName(displayName),
      status: feature.properties.source || csvRow?.source || "local geojson",
      coordinates: feature.geometry.coordinates || [],
    };
  });

export const STOPS: TransitStop[] = geoJson.features
  .filter((feature): feature is GeoJsonPointFeature => (
    ["stop", "station_stop", "stop_point"].includes(featureKind(feature)) && feature.geometry?.type === "Point"
  ))
  .map((feature) => {
    const pointId = feature.properties.id || feature.properties.stop_id || feature.properties.name;
    const routeId = feature.properties.route_id;
    return {
      id: pointId,
      mode: featureMode(feature),
      name: feature.properties.name,
      crowdLevel: feature.properties.crowd_level || "Crowd data pending",
      waitingCommuters: feature.properties.waiting_commuters_mock || 0,
      coordinates: feature.geometry.coordinates,
      routeId,
    };
  });

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

const ROUTE_VEHICLES_BY_ID = new Map(ROUTE_VEHICLES.map((vehicle) => [vehicle.id, vehicle]));

export const GOLDEN_ROUTE_GROUPS: Array<{
  type: VehicleType;
  label: string;
  routes: Array<{ id: string; label: string }>;
}> = [
  {
    type: "jeepney",
    label: "Jeepneys",
    routes: [
      { id: "LTFRB_PUJ1384", label: "PRC - Mantrade" },
      { id: "LTFRB_PUJ1798", label: "PRC - Libertad" },
      { id: "LTFRB_PUJ1360", label: "Guadalupe - L. Guinto" },
    ],
  },
  {
    type: "bus",
    label: "Buses",
    routes: [
      { id: "04_bus_EDSA_Carousel", label: "EDSA Carousel" },
      { id: "05_bus_Buendia_to_One_Ayala", label: "Buendia - One Ayala" },
    ],
  },
  {
    type: "uvexpress",
    label: "UV Express",
    routes: [
      { id: "06_uv_RCBC_Plaza_to_Antipolo", label: "RCBC Plaza - Antipolo" },
    ],
  },
  {
    type: "train",
    label: "Trains",
    routes: [
      { id: "ROUTE_880747", label: "LRT-1" },
      { id: "ROUTE_880801", label: "LRT-2" },
      { id: "ROUTE_880854", label: "MRT-3" },
    ],
  },
];

export const GOLDEN_ROUTE_VEHICLES: Vehicle[] = GOLDEN_ROUTE_GROUPS.flatMap((group) =>
  group.routes.map((route, index) => {
    const baseVehicle = ROUTE_VEHICLES_BY_ID.get(route.id);
    const routeData = ROUTES_BY_ID.get(route.id);
    const capacity = baseVehicle?.capacity || capacityForIndex(index);
    const maxOccupancy = group.type === "train" ? 380 : group.type === "bus" ? 45 : group.type === "uvexpress" ? 10 : 16;

    return {
      id: route.id,
      type: group.type,
      routeName: route.label,
      plateNo: baseVehicle?.plateNo || `${vehicleLabel(group.type)}-${route.id}`,
      capacity,
      eta: baseVehicle?.eta || 4 + index,
      distance: baseVehicle?.distance || "0.8 km",
      occupancy: baseVehicle?.occupancy || occupancyFor(capacity, maxOccupancy),
      maxOccupancy: baseVehicle?.maxOccupancy || maxOccupancy,
      stops: baseVehicle?.stops || routeData?.waypoints || [route.label],
      currentStop: baseVehicle?.currentStop || 0,
      emoji: vehicleLabel(group.type),
    };
  })
);

export const POPULAR_ROUTE_PAIRS = ROUTES.filter((route) => route.waypoints.length >= 2)
  .slice(0, 10)
  .map((route) => ({
    routeId: route.id,
    from: route.waypoints[0],
    to: route.waypoints[route.waypoints.length - 1],
  }));
