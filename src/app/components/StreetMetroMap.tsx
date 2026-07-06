import { Fragment, useEffect, useMemo, useState } from "react";
import { Circle, CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L, { type LatLngExpression, type LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { VehicleType } from "../App";
import { supabase } from "../lib/supabase";
import { ROUTES_BY_ID, STOPS, type TransitRoute } from "../data/routes";

const METRO_MANILA_BOUNDS: LatLngBoundsExpression = [
  [14.00, 120.55],
  [15.05, 121.45],
];

const DEFAULT_CENTER: LatLngExpression = [14.6091, 121.0223];

const HEAT_SPOTS: Array<{ center: LatLngExpression; radius: number; color: string }> = [
  { center: [14.619, 121.052], radius: 900, color: "#737373" },
  { center: [14.586, 121.057], radius: 750, color: "#9CA3AF" },
  { center: [14.554, 121.024], radius: 850, color: "#6B7280" },
  { center: [14.604, 120.982], radius: 700, color: "#A3A3A3" },
  { center: [14.655, 121.032], radius: 650, color: "#D4D4D4" },
];

const VEHICLE_SEAT_LIMITS: Record<VehicleType, number> = {
  jeepney: 18,
  uvexpress: 14,
  bus: 55,
  train: 1000,
};

interface SimulatedTelemetry {
  routeId: string;
  coordinateIndex: number;
  latitude: number;
  longitude: number;
  availableSeats: number;
  localTime: string;
}

export interface SearchedLocation {
  lat: number;
  lon: number;
  name: string;
}

interface Props {
  showHeatmap: boolean;
  activeFilters: string[];
  activeRouteId?: string | null;
  activeRouteIds?: string[];
  searchedLocation: SearchedLocation | null;
  onVehicleClick: (vehicleId: string) => void;
}

function markerIcon(type: VehicleType) {
  const color: Record<VehicleType, string> = {
    bus: "#525252",
    train: "#737373",
    jeepney: "#404040",
    uvexpress: "#8A8A8A",
  };

  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;
      width:18px;
      height:18px;
      border-radius:999px;
      background:${color[type]};
      border:3px solid #FFFFFF;
      box-shadow:0 4px 14px rgba(0,0,0,0.18), 0 0 0 4px rgba(255,255,255,0.7);
    "></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const searchedIcon = L.divIcon({
  className: "",
  html: `<span style="
    display:block;
    width:22px;
    height:22px;
    border-radius:999px 999px 999px 4px;
    background:#525252;
    border:3px solid #FFFFFF;
    transform:rotate(-45deg);
    box-shadow:0 8px 22px rgba(0,0,0,0.22);
  "></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 20],
});

function ChangeView({ location }: { location: SearchedLocation | null }) {
  const map = useMap();

  useEffect(() => {
    if (!location) return;
    map.flyTo([location.lat, location.lon], 14, { duration: 1.5 });
  }, [location, map]);

  return null;
}

function routeColor(routeId: string | null, type?: VehicleType) {
  if (routeId === "ROUTE_880747") return "#D4A017";
  if (routeId === "ROUTE_880801") return "#7B3FB2";
  if (routeId === "ROUTE_880854") return "#1B8F4D";
  if (type === "bus") return "#3F3F3F";
  if (type === "uvexpress") return "#6F6F6F";
  return "#525252";
}

function randomSeatDelta() {
  const direction = Math.random() > 0.5 ? 1 : -1;
  return direction * (1 + Math.floor(Math.random() * 3));
}

function clampSeats(value: number, max: number) {
  return Math.max(0, Math.min(max, value));
}

function localTimestamp() {
  return new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function initialTelemetryFor(route: TransitRoute): SimulatedTelemetry | null {
  const firstCoordinate = route.coordinates[0];
  if (!firstCoordinate) return null;

  const maxSeats = VEHICLE_SEAT_LIMITS[route.vehicleType];
  return {
    routeId: route.id,
    coordinateIndex: 0,
    latitude: firstCoordinate[1],
    longitude: firstCoordinate[0],
    availableSeats: Math.round(maxSeats * 0.55),
    localTime: localTimestamp(),
  };
}

async function syncTelemetryToSupabase(activeRoutes: TransitRoute[], telemetry: Record<string, SimulatedTelemetry>) {
  if (!supabase) return;

  const payload = activeRoutes
    .map((route) => {
      const state = telemetry[route.id];
      if (!state) return null;

      return {
        id: route.id,
        route_id: route.id,
        label: route.name,
        latitude: state.latitude,
        longitude: state.longitude,
        last_seen_at: new Date().toISOString(),
        metadata: {
          simulated: true,
          vehicle_type: route.vehicleType,
          available_seats: state.availableSeats,
          max_seats: VEHICLE_SEAT_LIMITS[route.vehicleType],
          coordinate_index: state.coordinateIndex,
          local_time: state.localTime,
        },
      };
    })
    .filter(Boolean);

  if (!payload.length) return;

  const { error } = await supabase.from("vehicles").upsert(payload, { onConflict: "id" });
  if (error) console.warn("Vehicle simulation upsert failed:", error.message);
}

export function StreetMetroMap({ showHeatmap, activeFilters, activeRouteId, activeRouteIds, searchedLocation, onVehicleClick }: Props) {
  const selectedRouteIds = activeRouteIds?.length ? activeRouteIds : activeRouteId ? [activeRouteId] : [];
  const selectedRouteKey = selectedRouteIds.join("|");
  const activeFilterKey = activeFilters.join("|");
  const activeRoutes = useMemo(() => selectedRouteIds
    .map((routeId) => ROUTES_BY_ID.get(routeId))
    .filter((route): route is TransitRoute => Boolean(route) && activeFilters.includes(route.vehicleType)), [activeFilterKey, selectedRouteKey]);
  const [simulationStates, setSimulationStates] = useState<Record<string, SimulatedTelemetry>>({});

  useEffect(() => {
    setSimulationStates((current) => {
      const next: Record<string, SimulatedTelemetry> = {};
      activeRoutes.forEach((route) => {
        const existing = current[route.id];
        const initialized = existing || initialTelemetryFor(route);
        if (initialized) next[route.id] = initialized;
      });
      return next;
    });
  }, [activeRoutes]);

  useEffect(() => {
    if (!activeRoutes.length) return;

    const intervalId = window.setInterval(() => {
      setSimulationStates((current) => {
        const next: Record<string, SimulatedTelemetry> = {};

        activeRoutes.forEach((route) => {
          const existing = current[route.id] || initialTelemetryFor(route);
          if (!existing || route.coordinates.length === 0) return;

          const coordinateIndex = (existing.coordinateIndex + 1) % route.coordinates.length;
          const coordinate = route.coordinates[coordinateIndex];
          const maxSeats = VEHICLE_SEAT_LIMITS[route.vehicleType];

          next[route.id] = {
            routeId: route.id,
            coordinateIndex,
            latitude: coordinate[1],
            longitude: coordinate[0],
            availableSeats: clampSeats(existing.availableSeats + randomSeatDelta(), maxSeats),
            localTime: localTimestamp(),
          };
        });

        void syncTelemetryToSupabase(activeRoutes, next);
        return next;
      });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [activeRoutes]);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={12}
      minZoom={10}
      maxBounds={METRO_MANILA_BOUNDS}
      maxBoundsViscosity={1}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
      style={{ background: "#F8F8F8", zIndex: 0 }}
    >
      <TileLayer
        attribution="OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="grayscale contrast-75 brightness-110"
      />

      {selectedRouteIds.length > 0 && showHeatmap && HEAT_SPOTS.map((spot, index) => (
        <Circle
          key={`${spot.color}-${index}`}
          center={spot.center}
          radius={spot.radius}
          pathOptions={{ color: spot.color, fillColor: spot.color, fillOpacity: 0.2, opacity: 0.32, weight: 1 }}
        />
      ))}

      {activeRoutes.map((route) => {
        if (!route) return null;
        const routePath = route.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
        const color = routeColor(route.id, route.vehicleType);

        return (
          <Fragment key={`${route.id}-line`}>
            <Polyline
              positions={routePath}
              pathOptions={{ color: "#FFFFFF", opacity: 0.95, weight: 9, lineCap: "round", lineJoin: "round" }}
            />
            <Polyline
              positions={routePath}
              pathOptions={{ color, opacity: 0.92, weight: 4, lineCap: "round", lineJoin: "round" }}
            />
          </Fragment>
        );
      })}

      {activeRoutes.map((route) => {
        const telemetry = simulationStates[route.id];
        const vehiclePosition = telemetry
          ? [telemetry.longitude, telemetry.latitude]
          : route.coordinates[Math.floor(route.coordinates.length / 2)];
        if (!vehiclePosition) return null;

        return (
          <Marker
            key={`${route.id}-vehicle`}
            position={[vehiclePosition[1], vehiclePosition[0]]}
            icon={markerIcon(route.vehicleType)}
            eventHandlers={{ click: () => onVehicleClick(route.id) }}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong>{route.name}</strong>
                {telemetry && (
                  <>
                    <br />
                    Seats: {telemetry.availableSeats}/{VEHICLE_SEAT_LIMITS[route.vehicleType]}
                    <br />
                    Updated: {telemetry.localTime}
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {activeRoutes.flatMap((route) => {
        if (!route || route.vehicleType !== "train") return [];
        const color = routeColor(route.id, route.vehicleType);

        return STOPS.filter((stop) => stop.routeId === route.id).map((station) => (
          <CircleMarker
            key={station.id}
            center={[station.coordinates[1], station.coordinates[0]]}
            radius={6}
            pathOptions={{
              color: "#FFFFFF",
              fillColor: color,
              fillOpacity: 1,
              opacity: 1,
              weight: 2,
            }}
          >
            <Popup>{station.name}</Popup>
          </CircleMarker>
        ));
      })}

      {searchedLocation && (
        <Marker position={[searchedLocation.lat, searchedLocation.lon]} icon={searchedIcon}>
          <Popup>{searchedLocation.name}</Popup>
        </Marker>
      )}

      <ChangeView location={searchedLocation} />
    </MapContainer>
  );
}
