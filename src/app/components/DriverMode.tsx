import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

interface CurrentLocation {
  lat: number;
  lng: number;
}

const DRIVER_ROUTE_ID = "J11";
const DRIVER_ROUTE_LABEL = "Baclaran-Monumento Jeep";

export function DriverMode() {
  const [isTracking, setIsTracking] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [status, setStatus] = useState("Ready to broadcast");
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  const broadcastLocation = async (location: CurrentLocation) => {
    if (!supabase) {
      setStatus("Add Supabase env values before broadcasting");
      return;
    }

    const trimmedVehicleId = vehicleId.trim();
    if (!trimmedVehicleId) {
      setStatus("Enter the vehicle UUID first");
      return;
    }

    const { error } = await supabase
      .from("vehicles")
      .upsert(
        {
          id: trimmedVehicleId,
          route_id: DRIVER_ROUTE_ID,
          label: DRIVER_ROUTE_LABEL,
          latitude: location.lat,
          longitude: location.lng,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error("Vehicle location upsert error:", error);
      setStatus(error.message);
      return;
    }

    setStatus("Broadcasting live location");
  };

  const startTracking = async () => {
    if (isTracking || watchIdRef.current !== null) return;

    if (!vehicleId.trim()) {
      setStatus("Enter the vehicle UUID first");
      return;
    }

    if (!("geolocation" in navigator)) {
      setStatus("Browser geolocation is not available on this device");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCurrentLocation(nextLocation);
        void broadcastLocation(nextLocation);
      },
      (error) => {
        console.error("Geolocation watch error:", error);
        setStatus(error.message || "Unable to read GPS position");
        setIsTracking(false);
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    watchIdRef.current = watchId;
    setIsTracking(true);
    setStatus("Starting GPS broadcast");
  };

  const stopTracking = () => {
    if (watchIdRef.current === null) {
      setIsTracking(false);
      return;
    }

    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setIsTracking(false);
    setStatus("Broadcast stopped");
  };

  return (
    <div className="w-full h-full flex flex-col gap-5 p-5" style={{ background: "#F8F8F8", color: "#2F2F2F" }}>
      <div>
        <p style={{ fontSize: 12, fontWeight: 800, color: "#7A7A7A", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Driver Mode
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 4 }}>Live Vehicle Broadcast</h1>
      </div>

      <label className="flex flex-col gap-2">
        <span style={{ fontSize: 12, fontWeight: 800, color: "#6F6F6F" }}>Vehicle tester UUID</span>
        <input
          value={vehicleId}
          onChange={(event) => setVehicleId(event.target.value)}
          disabled={isTracking}
          placeholder="vehicles.id"
          style={{
            width: "100%",
            border: "1px solid #D8D8D8",
            borderRadius: 14,
            padding: "14px 16px",
            fontSize: 14,
            outline: "none",
            background: isTracking ? "#EFEFEF" : "#FFFFFF",
            color: "#2F2F2F",
          }}
        />
      </label>

      <button
        onClick={isTracking ? stopTracking : startTracking}
        className="w-full rounded-2xl"
        style={{
          minHeight: 132,
          background: isTracking ? "#2F2F2F" : "#FFFFFF",
          color: isTracking ? "#FFFFFF" : "#2F2F2F",
          border: "1px solid #D8D8D8",
          boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
          fontSize: 26,
          fontWeight: 900,
        }}
      >
        {isTracking ? "Stop Broadcasting" : "Start Broadcasting"}
      </button>

      <div className="rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid #D8D8D8" }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: "#7A7A7A", marginBottom: 10 }}>Current live coordinates</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p style={{ fontSize: 11, color: "#8A8A8A" }}>Latitude</p>
            <p style={{ fontSize: 18, fontWeight: 800 }}>{currentLocation ? currentLocation.lat.toFixed(6) : "--"}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#8A8A8A" }}>Longitude</p>
            <p style={{ fontSize: 18, fontWeight: 800 }}>{currentLocation ? currentLocation.lng.toFixed(6) : "--"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: "#EFEFEF", border: "1px solid #D8D8D8" }}>
        <p style={{ fontSize: 12, color: "#5F5F5F", lineHeight: 1.5 }}>{status}</p>
      </div>
    </div>
  );
}
