import { MapPin } from "lucide-react";

interface CurrentLocation {
  lat: number;
  lon: number;
  name: string;
}

interface Props {
  isSharing: boolean;
  currentLocation: CurrentLocation | null;
  status: string;
  onToggle: () => void;
}

export function UserLocationSharing({ isSharing, currentLocation, status, onToggle }: Props) {
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
            onClick={onToggle}
            className="px-3 py-2 rounded-xl shrink-0"
            style={{ background: isSharing ? "#233D4D" : "#2FA4D7", color: isSharing ? "#EAECF0" : "#000", fontSize: 12, fontWeight: 800 }}
          >
            {isSharing ? "Stop" : "Start"}
          </button>
        </div>
        {currentLocation && (
          <p style={{ color: "#8899A8", fontSize: 11, marginTop: 12 }}>
            {currentLocation.lat.toFixed(6)}, {currentLocation.lon.toFixed(6)}
          </p>
        )}
      </div>
    </div>
  );
}
