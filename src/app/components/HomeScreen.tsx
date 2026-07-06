import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Navigation } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { StreetMetroMap, type SearchedLocation } from "./StreetMetroMap";
import { Vehicle } from "../App";
import { ensureGuestUser, supabase } from "../lib/supabase";
import { GOLDEN_ROUTE_GROUPS, GOLDEN_ROUTE_VEHICLES } from "../data/routes";
import gpsIcon from "../assets/gps.jpg";
import gpsIconInverted from "../assets/gps_inverted.png";
import busIcon from "../assets/bus.png";
import jeepneyIcon from "../assets/jeepney.png";
import trainIcon from "../assets/train.png";
import uvIcon from "../assets/uv.png";

type HomeFlow = "prompt" | "map" | "routes";

interface Props {
  user: User | null;
  flow: HomeFlow;
  activeRouteIds: string[];
  isSharingLocation: boolean;
  userLocation: SearchedLocation | null;
  locationStatus: string;
  onFlowChange: (flow: HomeFlow) => void;
  onActiveRouteIdsChange: (routeIds: string[]) => void;
  onToggleLocationSharing: () => void;
  onVehicleSelect: (v: Vehicle) => void;
}

const VEHICLES_BY_ID: Record<string, Vehicle> = {};
GOLDEN_ROUTE_VEHICLES.forEach((vehicle) => { VEHICLES_BY_ID[vehicle.id] = vehicle; });

const ACTIVE_FILTERS = ["jeepney", "bus", "train", "uvexpress"];
const GOLDEN_ROUTE_IDS = new Set(GOLDEN_ROUTE_VEHICLES.map((vehicle) => vehicle.id));
const PICKER_FILTERS: Array<{ id: Vehicle["type"] | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "jeepney", label: "Jeep" },
  { id: "bus", label: "Bus" },
  { id: "uvexpress", label: "UV" },
  { id: "train", label: "Train" },
];

const VEHICLE_ICON_BY_TYPE: Record<Vehicle["type"], string> = {
  bus: busIcon,
  jeepney: jeepneyIcon,
  train: trainIcon,
  uvexpress: uvIcon,
};

function VehicleTypeIcon({ type, size = 28 }: { type: Vehicle["type"]; size?: number }) {
  return (
    <img
      src={VEHICLE_ICON_BY_TYPE[type]}
      alt=""
      style={{ width: size, height: size, objectFit: "contain", display: "block" }}
    />
  );
}

function capacityLabel(vehicle: Vehicle) {
  return `${vehicle.capacity.charAt(0).toUpperCase()}${vehicle.capacity.slice(1)}`;
}

export function HomeScreen({ user, flow, activeRouteIds, isSharingLocation, userLocation, locationStatus, onFlowChange, onActiveRouteIdsChange, onToggleLocationSharing, onVehicleSelect }: Props) {
  const [routeSelectionStatus, setRouteSelectionStatus] = useState("Select Route");
  const [pickerFilter, setPickerFilter] = useState<Vehicle["type"] | "all">("all");
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [tripStatus, setTripStatus] = useState("No active trip");
  const loadedFrequentRouteRef = useRef(false);
  const userIdRef = useRef<string | null>(user?.id ?? null);

  useEffect(() => {
    userIdRef.current = user?.id ?? userIdRef.current;
  }, [user?.id]);

  const activeRouteId = activeRouteIds[0] ?? null;
  const activeVehicle = activeRouteId ? VEHICLES_BY_ID[activeRouteId] : null;

  useEffect(() => {
    if (flow !== "map" || loadedFrequentRouteRef.current || activeRouteIds.length > 0) return;
    loadedFrequentRouteRef.current = true;

    async function loadMostSelectedRoute() {
      if (!supabase) {
        setRouteSelectionStatus("Select Route");
        return;
      }

      const { data, error } = await supabase
        .from("route_selection_events")
        .select("route_id")
        .limit(1000);

      if (error || !data?.length) {
        setRouteSelectionStatus("Select Route");
        return;
      }

      const counts = data.reduce<Record<string, number>>((acc, row) => {
        const routeId = String(row.route_id || "");
        if (GOLDEN_ROUTE_IDS.has(routeId)) acc[routeId] = (acc[routeId] || 0) + 1;
        return acc;
      }, {});

      const [topRouteId] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
      if (topRouteId) {
        onActiveRouteIdsChange([topRouteId]);
        setRouteSelectionStatus("Most selected route");
      } else {
        setRouteSelectionStatus("Select Route");
      }
    }

    void loadMostSelectedRoute();
  }, [activeRouteIds.length, flow, onActiveRouteIdsChange]);

  const recordRouteSelection = async (routeId: string) => {
    if (!supabase) return;

    const { error } = await supabase
      .from("route_selection_events")
      .insert({
        route_id: routeId,
        user_id: userIdRef.current,
        selected_at: new Date().toISOString(),
      });

    if (error) console.warn("Route selection event failed:", error.message);
  };

  const toggleRouteSelection = (routeId: string) => {
    const selected = activeRouteIds.includes(routeId);
    const nextRouteIds = selected
      ? activeRouteIds.filter((id) => id !== routeId)
      : [...activeRouteIds, routeId];

    onActiveRouteIdsChange(nextRouteIds);
    setRouteSelectionStatus(nextRouteIds.length ? "Selected routes" : "Select Route");
    if (!selected) void recordRouteSelection(routeId);
  };

  const openRouteOnMap = (vehicle: Vehicle) => {
    onActiveRouteIdsChange([vehicle.id]);
    setRouteSelectionStatus("Selected route");
    void recordRouteSelection(vehicle.id);
    onFlowChange("map");
  };

  const ensureTripUserId = async () => {
    if (userIdRef.current) return userIdRef.current;
    const { user: guestUser, error } = await ensureGuestUser();
    if (error || !guestUser) {
      setTripStatus(error?.message || "Unable to create guest trip profile");
      return null;
    }
    userIdRef.current = guestUser.id;
    return guestUser.id;
  };

  const startTrip = async () => {
    if (!activeRouteIds.length) {
      setTripStatus("Select a route before starting");
      return;
    }

    if (!supabase) {
      setActiveTripId(`local-${Date.now()}`);
      setTripStatus("Trip started locally");
      return;
    }

    const userId = await ensureTripUserId();
    if (!userId) return;

    const { data, error } = await supabase
      .from("trip_history")
      .insert({
        user_id: userId,
        route_ids: activeRouteIds,
        started_at: new Date().toISOString(),
        status: "active",
      })
      .select("id")
      .single();

    if (error) {
      setTripStatus(error.message);
      return;
    }

    setActiveTripId(data.id);
    setTripStatus("Trip started");
  };

  const endTrip = async () => {
    if (!activeTripId) return;

    if (!supabase || activeTripId.startsWith("local-")) {
      setActiveTripId(null);
      setTripStatus("Trip ended locally");
      return;
    }

    const { error } = await supabase
      .from("trip_history")
      .update({
        ended_at: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", activeTripId);

    setActiveTripId(null);
    setTripStatus(error ? error.message : "Trip saved to history");
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

        <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-5">
          {GOLDEN_ROUTE_GROUPS.map((group) => (
            <section key={group.label} className="flex flex-col gap-3">
              <h2 style={{ color: "#6F6F6F", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.6 }}>
                {group.label}
              </h2>

              {group.routes.map((route) => {
                const vehicle = VEHICLES_BY_ID[route.id];
                if (!vehicle) return null;
                const active = activeRouteIds.includes(vehicle.id);

                return (
                  <button
                    key={vehicle.id}
                    onClick={() => openRouteOnMap(vehicle)}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl"
                    style={{
                      background: "#FFFFFF",
                      border: active ? "1.5px solid #2FA4D7" : "1px solid #D8D8D8",
                      boxShadow: active ? "0 8px 22px rgba(47,164,215,0.18)" : "0 4px 14px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#F1F1F1", color: "#3F3F3F", fontSize: 12, fontWeight: 900 }}>
                      <VehicleTypeIcon type={vehicle.type} />
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
                );
              })}
            </section>
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
          activeRouteIds={activeRouteIds}
          searchedLocation={userLocation}
          onVehicleClick={(id) => {
            const vehicle = VEHICLES_BY_ID[id];
            if (vehicle) onVehicleSelect(vehicle);
          }}
        />
      </div>

      <div className="absolute left-4 right-4 flex items-center justify-between" style={{ top: 38, zIndex: 40 }}>
        <button
          onClick={() => activeRouteIds.length ? onFlowChange("routes") : onFlowChange("prompt")}
          className="h-11 px-4 rounded-2xl flex items-center gap-2"
          style={{ background: "rgba(255,255,255,0.96)", border: "1px solid #D8D8D8", color: "#3F3F3F", fontSize: 13, fontWeight: 800 }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <button
          onClick={onToggleLocationSharing}
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
        className="absolute left-4 right-4 rounded-2xl p-3"
        style={{ bottom: 18, zIndex: 40, background: "rgba(255,255,255,0.98)", border: "1px solid #D8D8D8", boxShadow: "0 10px 28px rgba(0,0,0,0.14)" }}
      >
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            {activeVehicle ? (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#F1F1F1", color: "#3F3F3F", fontSize: 11, fontWeight: 900 }}>
                <VehicleTypeIcon type={activeVehicle.type} size={24} />
              </div>
            ) : null}
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ color: "#2F2F2F", fontSize: 14, fontWeight: 900 }}>
                {activeVehicle ? activeVehicle.routeName : "Select Route"}
              </p>
              <p style={{ color: "#7A7A7A", fontSize: 11, marginTop: 2 }}>
                {activeRouteIds.length > 1 ? `${activeRouteIds.length} routes selected` : routeSelectionStatus}
              </p>
            </div>
            <button onClick={() => onFlowChange("routes")} style={{ color: "#3F3F3F" }} title="Open route list">
              <Navigation size={20} />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {PICKER_FILTERS.map((filter) => {
              const active = pickerFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setPickerFilter(filter.id)}
                  className="shrink-0 rounded-full px-3 py-1.5"
                  style={{
                    background: active ? "#233D4D" : "#F1F1F1",
                    border: active ? "1px solid #233D4D" : "1px solid #D8D8D8",
                    color: active ? "#FFFFFF" : "#3F3F3F",
                    fontSize: 10,
                    fontWeight: 900,
                  }}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="max-h-28 overflow-y-auto pr-1 flex flex-col gap-1.5">
            {GOLDEN_ROUTE_GROUPS.filter((group) => pickerFilter === "all" || group.type === pickerFilter).map((group) => (
              <div key={group.label} className="flex flex-wrap gap-2">
                {group.routes.map((route) => {
                  const vehicle = VEHICLES_BY_ID[route.id];
                  if (!vehicle) return null;
                  const selected = activeRouteIds.includes(route.id);

                  return (
                    <button
                      key={route.id}
                      onClick={() => toggleRouteSelection(route.id)}
                      className="rounded-full px-2.5 py-1.5"
                      style={{
                        background: selected ? "#2FA4D7" : "#F1F1F1",
                        border: selected ? "1px solid #2FA4D7" : "1px solid #D8D8D8",
                        color: selected ? "#111111" : "#3F3F3F",
                        fontSize: 10,
                        fontWeight: 900,
                      }}
                    >
                      {vehicle.routeName}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={activeTripId ? endTrip : startTrip}
              className="shrink-0 rounded-full px-3 py-2"
              style={{ background: activeTripId ? "#2F2F2F" : "#2FA4D7", color: activeTripId ? "#FFFFFF" : "#111111", fontSize: 11, fontWeight: 900 }}
            >
              {activeTripId ? "End Trip" : "Start Trip"}
            </button>
            <p className="truncate" style={{ color: "#7A7A7A", fontSize: 10, lineHeight: 1.35 }}>
              {tripStatus} - {locationStatus}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
