import { useEffect } from "react";
import { Circle, CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L, { type LatLngExpression, type LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { VehicleType } from "../App";
import { ROUTES_BY_ID } from "../data/routes";

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

export interface SearchedLocation {
  lat: number;
  lon: number;
  name: string;
}

interface Props {
  showHeatmap: boolean;
  activeFilters: string[];
  activeRouteId: string | null;
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

export function StreetMetroMap({ showHeatmap, activeFilters, activeRouteId, searchedLocation, onVehicleClick }: Props) {
  const activeRoute = activeRouteId ? ROUTES_BY_ID.get(activeRouteId) : null;
  const shouldShowActiveRoute = activeRoute && activeFilters.includes(activeRoute.vehicleType);
  const activeRoutePath = activeRoute?.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]) ?? [];
  const markerIndex = activeRoute ? Math.floor(activeRoute.coordinates.length / 2) : 0;
  const activeVehiclePosition = activeRoute?.coordinates[markerIndex];

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

      {activeRouteId && showHeatmap && HEAT_SPOTS.map((spot, index) => (
        <Circle
          key={`${spot.color}-${index}`}
          center={spot.center}
          radius={spot.radius}
          pathOptions={{ color: spot.color, fillColor: spot.color, fillOpacity: 0.2, opacity: 0.32, weight: 1 }}
        />
      ))}

      {shouldShowActiveRoute && (
        <>
          <Polyline
            positions={activeRoutePath}
            pathOptions={{ color: "#FFFFFF", opacity: 0.95, weight: 9, lineCap: "round", lineJoin: "round" }}
          />
          <Polyline
            positions={activeRoutePath}
            pathOptions={{ color: "#525252", opacity: 0.92, weight: 4, lineCap: "round", lineJoin: "round" }}
          />
        </>
      )}

      {shouldShowActiveRoute && activeRoute && activeVehiclePosition && (
        <Marker
          position={[activeVehiclePosition[1], activeVehiclePosition[0]]}
          icon={markerIcon(activeRoute.vehicleType)}
          eventHandlers={{ click: () => onVehicleClick(activeRoute.id) }}
        >
          <Popup>{activeRoute.name}</Popup>
        </Marker>
      )}

      {activeRouteId && (
        <CircleMarker
          center={[14.638, 121.044]}
          radius={7}
          pathOptions={{ color: "#fff", fillColor: "#525252", fillOpacity: 1, weight: 2 }}
        />
      )}

      {searchedLocation && (
        <Marker position={[searchedLocation.lat, searchedLocation.lon]} icon={searchedIcon}>
          <Popup>{searchedLocation.name}</Popup>
        </Marker>
      )}

      <ChangeView location={searchedLocation} />
    </MapContainer>
  );
}
