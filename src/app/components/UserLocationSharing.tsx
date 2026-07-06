import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { ensureGuestUser, supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

interface CurrentLocation {
  lat: number;
  lng: number;
}

interface Props {
  user: User | null;
}

export function UserLocationSharing({ user }: Props) {
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [status, setStatus] = useState("Location sharing is off");
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

  const upsertLocation = async (location: CurrentLocation) => {
    if (!supabase) {
      setStatus("Add Supabase env values before sharing location");
      return;
    }

    if (!userIdRef.current) {
      const { user: guestUser, error } = await ensureGuestUser();
      if (error || !guestUser) {
        setStatus(error?.message || "Unable to create anonymous user");
        return;
      }
      userIdRef.current = guestUser.id;
    }

    const { error } = await supabase
      .from("user_locations")
      .upsert(
        {
          user_id: userIdRef.current,
          latitude: location.lat,
          longitude: location.lng,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Sharing live location");
  };

  const startSharing = async () => {
    if (isSharing || watchIdRef.current !== null) return;

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
        void upsertLocation(nextLocation);
      },
      (error) => {
        setStatus(error.message || "Unable to read GPS position");
        setIsSharing(false);
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    watchIdRef.current = watchId;
    setIsSharing(true);
    setStatus("Starting location sharing");
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
    setStatus("Location sharing is off");
  };

  return (
    <div className="px-4 mb-4">
      <div className="rounded-2xl p-4" style={{ background: "#0E1E2A", border: "1px solid #1C3344" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MapPin size={18} color="#4A6070" />
            <div>
              <p style={{ color: "#EAECF0", fontSize: 14, fontWeight: 700 }}>Share Live Location</p>
              <p style={{ color: "#4A6070", fontSize: 11, marginTop: 2 }}>{status}</p>
            </div>
          </div>
          <button
            onClick={isSharing ? stopSharing : startSharing}
            className="px-3 py-2 rounded-xl shrink-0"
            style={{ background: isSharing ? "#233D4D" : "#2FA4D7", color: isSharing ? "#EAECF0" : "#000", fontSize: 12, fontWeight: 800 }}
          >
            {isSharing ? "Stop" : "Start"}
          </button>
        </div>
        {currentLocation && (
          <p style={{ color: "#8899A8", fontSize: 11, marginTop: 12 }}>
            {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          </p>
        )}
      </div>
    </div>
  );
}
