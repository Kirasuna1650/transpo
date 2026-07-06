import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Navigation } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { StreetMetroMap, type SearchedLocation } from "./StreetMetroMap";
import { Vehicle } from "../App";
import { ensureGuestUser, supabase } from "../lib/supabase";
import { ROUTE_VEHICLES, ROUTES_BY_ID } from "../data/routes";
import gpsIcon from "../assets/gps.jpg";
import gpsIconInverted from "../assets/gps_inverted.png";

type HomeFlow = "prompt" | "map" | "routes";

interface Props {
  user: User | null;
  flow: HomeFlow;
  activeRouteId: string | null;
  onFlowChange: (flow: HomeFlow) => void;
  onActiveRouteChange: (routeId: string | null) => void;
  onVehicleSelect: (v: Vehicle) => void;
}

const VEHICLES_BY_ID: Record<string, Vehicle> = {};
ROUTE_VEHICLES.forEach((vehicle) => { VEHICLES_BY_ID[vehicle.id] = vehicle; });

const ACTIVE_FILTERS = ["jeepney", "bus", "train", "uvexpress"];
const ROUTE_FILTERS: { id: Vehicle["type"] | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "jeepney", label: "Jeep" },
  { id: "bus", label: "Bus" },
  { id: "uvexpress", label: "PUV" },
  { id: "train", label: "Train" },
];

function routeBadge(type: Vehicle["type"]) {
  if (type === "bus") return "BUS";
  if (type === "train") return "MRT";
  if (type === "uvexpress") return "UV";
  return "PUJ";
}

function capacityLabel(vehicle: Vehicle) {
  return `${vehicle.capacity.charAt(0).toUpperCase()}${vehicle.capacity.slice(1)}`;
}

export function HomeScreen({ user, flow, activeRouteId, onFlowChange, onActiveRouteChange, onVehicleSelect }: Props) {
  const [routeFilter, setRouteFilter] = useState<Vehicle["type"] | "all">("all");
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<SearchedLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState("GPS sharing is off");
  const watchIdRef = useRef<number | null>(null);
  const userIdRef = useRef<string | null>(user?.id ?? null);

  useEffect(() => {
    userIdRef.current = user?.id ?? userIdRef.current;
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  const activeVehicle = activeRouteId ? VEHICLES_BY_ID[activeRouteId] : null;
  const visibleRoutes = useMemo(
    () => ROUTE_VEHICLES.filter((vehicle) => routeFilter === "all" || vehicle.type === routeFilter).slice(0, 30),
    [routeFilter]
  );

  const upsertUserLocation = async (lat: number, lng: number) => {
    if (!supabase) {
      setLocationStatus("Add Supabase env values before sharing");
      return;
    }

    if (!userIdRef.current) {
      const { user: guestUser, error } = await ensureGuestUser();
      if (error || !guestUser) {
        setLocationStatus(error?.message || "Unable to create anonymous user");
        return;
      }
      userIdRef.current = guestUser.id;
    }

    const { error } = await supabase.from("user_locations").upsert(
      {
        user_id: userIdRef.current,
        latitude: lat,
        longitude: lng,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    setLocationStatus(error ? error.message : "Sharing GPS location");
  };

  const startGpsSharing = async () => {
    if (watchIdRef.current !== null) return;

    if (!("geolocation" in navigator)) {
      setLocationStatus("Browser geolocation is not available on this device");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat, lon: lng, name: "Your live location" });
        void upsertUserLocation(lat, lng);
      },
      (error) => {
        setLocationStatus(error.message || "Unable to read GPS position");
        setIsSharingLocation(false);
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    watchIdRef.current = watchId;
    setIsSharingLocation(true);
    setLocationStatus("Starting GPS sharing");
  };

  const stopGpsSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharingLocation(false);
    setLocationStatus("GPS sharing is off");
  };

  const openRouteOnMap = (vehicle: Vehicle) => {
    onActiveRouteChange(vehicle.id);
    onFlowChange("map");
  };

  if (flow === "prompt") {
    return (
      <div className="w-full h-full flex items-center justify-center px-6 pb-8" style={{ background: "#F8F8F8" }}>
        <div className="w-full flex flex-col gap-4">
          <button
            onClick={() => onFlowChange("map")}
            className="w-full rounded-2xl flex items-center justify-center"
            style={{
              minHeight: 96,
              background: "#2FA4D7",
              color: "#111111",
              border: "1px solid #248FBE",
              boxShadow: "0 12px 28px rgba(47,164,215,0.25)",
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            Open Map
          </button>

          <button
            onClick={() => onFlowChange("routes")}
            className="w-full rounded-2xl flex items-center justify-center"
            style={{
              minHeight: 96,
              background: "#233D4D",
              color: "#FFFFFF",
              border: "1px solid #1C3344",
              boxShadow: "0 12px 28px rgba(35,61,77,0.22)",
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            Choose Routes
          </button>
        </div>
      </div>
    );
  }

  if (flow === "routes") {
    return (
      <div className="w-full h-full flex flex-col" style={{ background: "#F8F8F8" }}>
        <div className="shrink-0 px-5 pt-10 pb-3">
          <button onClick={() => onFlowChange("prompt")} className="flex items-center gap-2 mb-4" style={{ color: "#5F5F5F", fontSize: 13, fontWeight: 800 }}>
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 style={{ color: "#2F2F2F", fontSize: 24, fontWeight: 900 }}>Choose Routes</h1>
        </div>

        <div className="shrink-0 px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {ROUTE_FILTERS.map((filter) => {
              const active = routeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setRouteFilter(filter.id)}
                  className="h-10 px-4 rounded-full"
                  style={{
                    background: active ? "#2FA4D7" : "#FFFFFF",
                    border: active ? "1px solid #2FA4D7" : "1px solid #D8D8D8",
                    color: active ? "#111111" : "#3F3F3F",
                    fontSize: 13,
                    fontWeight: 900,
                    boxShadow: active ? "0 8px 18px rgba(47,164,215,0.18)" : "none",
                  }}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-3">
          {visibleRoutes.map((vehicle) => (
            <button
              key={vehicle.id}
              onClick={() => openRouteOnMap(vehicle)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: "#FFFFFF", border: "1px solid #D8D8D8", boxShadow: "0 4px 14px rgba(0,0,0,0.05)" }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#F1F1F1", color: "#3F3F3F", fontSize: 12, fontWeight: 900 }}>
                {routeBadge(vehicle.type)}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="truncate" style={{ color: "#2F2F2F", fontSize: 15, fontWeight: 800 }}>{vehicle.routeName}</p>
                <p style={{ color: "#7A7A7A", fontSize: 12, marginTop: 4 }}>
                  {capacityLabel(vehicle)} - {vehicle.distance}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span style={{ color: "#2F2F2F", fontSize: 22, fontWeight: 900 }}>{vehicle.eta}</span>
                <span style={{ color: "#7A7A7A", fontSize: 11 }}> min</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate w-full h-full overflow-hidden" style={{ background: "#F8F8F8" }}>
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <StreetMetroMap
          showHeatmap={false}
          activeFilters={ACTIVE_FILTERS}
          activeRouteId={activeRouteId}
          searchedLocation={userLocation}
          onVehicleClick={(id) => {
            const vehicle = VEHICLES_BY_ID[id];
            if (vehicle) onVehicleSelect(vehicle);
          }}
        />
      </div>

      <div className="absolute left-4 right-4 flex items-center justify-between" style={{ top: 38, zIndex: 40 }}>
        <button
          onClick={() => activeRouteId ? onFlowChange("routes") : onFlowChange("prompt")}
          className="h-11 px-4 rounded-2xl flex items-center gap-2"
          style={{ background: "rgba(255,255,255,0.96)", border: "1px solid #D8D8D8", color: "#3F3F3F", fontSize: 13, fontWeight: 800 }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <button
          onClick={isSharingLocation ? stopGpsSharing : startGpsSharing}
          className="h-12 w-12 rounded-2xl flex items-center justify-center"
          title="Toggle GPS location sharing"
          style={{
            background: isSharingLocation ? "#2F2F2F" : "rgba(255,255,255,0.96)",
            border: "1px solid #D8D8D8",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          <img
            src={isSharingLocation ? gpsIconInverted : gpsIcon}
            alt=""
            className="w-6 h-6 object-contain"
          />
        </button>
      </div>

      <div
        className="absolute left-4 right-4 rounded-2xl p-4"
        style={{ bottom: 18, zIndex: 40, background: "rgba(255,255,255,0.98)", border: "1px solid #D8D8D8", boxShadow: "0 10px 28px rgba(0,0,0,0.14)" }}
      >
        {activeVehicle ? (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#F1F1F1", color: "#3F3F3F", fontSize: 12, fontWeight: 900 }}>
              {routeBadge(activeVehicle.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ color: "#2F2F2F", fontSize: 15, fontWeight: 900 }}>{activeVehicle.routeName}</p>
              <p style={{ color: "#7A7A7A", fontSize: 12, marginTop: 3 }}>Chosen route shown on map</p>
            </div>
            <button onClick={() => onFlowChange("routes")} style={{ color: "#3F3F3F" }}>
              <Navigation size={20} />
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: "#2F2F2F", fontSize: 15, fontWeight: 900 }}>Open Map</p>
            <p style={{ color: "#7A7A7A", fontSize: 12, marginTop: 4, lineHeight: 1.45 }}>
              {locationStatus}. Your current pin appears on the map while sharing.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
