import { useMemo, useState } from "react";
import { ExternalLink, Map, Search } from "lucide-react";
import { ROUTES, type TransitRoute } from "../data/routes";

interface Props {
  onShowMap: (from: string, to: string) => void;
}

const MODE_FILTER = [
  { id: "all", label: "All" },
  { id: "jeepney", label: "Jeepney" },
  { id: "bus", label: "Bus" },
  { id: "train", label: "Train" },
  { id: "uvexpress", label: "UV Express" },
];

function routeBadge(route: TransitRoute) {
  if (route.vehicleType === "bus") return "BUS";
  if (route.vehicleType === "train") return route.mode.includes("LRT") ? "LRT" : "MRT";
  if (route.vehicleType === "uvexpress") return "UV";
  return "PUJ";
}

function estimateEta(route: TransitRoute, index: number) {
  const baseEta = route.vehicleType === "train" ? 24 : route.vehicleType === "bus" ? 42 : route.vehicleType === "uvexpress" ? 34 : 38;
  return baseEta + Math.min(route.waypoints.length * 2, 20) + (index % 8);
}

function openInMaps(from: string, to: string) {
  const origin = encodeURIComponent(`${from}, Greater Manila, Philippines`);
  const dest = encodeURIComponent(`${to}, Greater Manila, Philippines`);
  window.open(
    `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=transit`,
    "_blank",
    "noopener,noreferrer"
  );
}

export function RoutePlannerScreen({ onShowMap }: Props) {
  const [modeFilter, setModeFilter] = useState("all");
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ROUTES.filter((route) => {
      const modeMatches = modeFilter === "all" || route.vehicleType === modeFilter;
      const textMatches = !normalizedQuery || `${route.name} ${route.waypoints.join(" ")}`.toLowerCase().includes(normalizedQuery);
      return modeMatches && textMatches;
    });
  }, [modeFilter, query]);

  return (
    <div className="w-full h-full flex flex-col" style={{ background: "#000" }}>
      <div className="shrink-0 pt-10 px-4 pb-3">
        <h1 style={{ color: "#EAECF0", fontSize: 24, fontWeight: 900 }}>Routes</h1>
        <p style={{ color: "#3A5060", fontSize: 12, marginTop: 3 }}>Choose a route, then open it on the map.</p>

        <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "#0E1E2A", border: "1px solid #1C3344" }}>
          <Search size={17} color="#4A6070" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search routes"
            className="min-w-0 flex-1 bg-transparent outline-none"
            style={{ color: "#EAECF0", fontSize: 14 }}
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto">
          {MODE_FILTER.map(({ id, label }) => {
            const active = modeFilter === id;
            return (
              <button
                key={id}
                onClick={() => setModeFilter(id)}
                className="shrink-0 px-3 py-1.5 rounded-full"
                style={{
                  background: active ? "#2FA4D7" : "#0E1E2A",
                  color: active ? "#000" : "#4A6070",
                  border: `1px solid ${active ? "#2FA4D7" : "#1C3344"}`,
                  fontSize: 12,
                  fontWeight: active ? 800 : 500,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-3">
        {results.map((route, index) => {
          const stops = route.waypoints.length ? route.waypoints : [route.name];
          const from = stops[0];
          const to = stops[stops.length - 1];
          return (
            <article
              key={route.id}
              className="rounded-2xl p-4"
              style={{ background: "#0E1E2A", border: "1px solid #1C3344" }}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#233D4D", color: "#2FA4D7", fontSize: 12, fontWeight: 900 }}>
                  {routeBadge(route)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 style={{ color: "#EAECF0", fontSize: 15, fontWeight: 900, lineHeight: 1.25 }}>{route.name}</h2>
                  <p style={{ color: "#4A6070", fontSize: 12, marginTop: 5 }}>
                    {from}{from !== to ? ` to ${to}` : ""}
                  </p>
                  <p style={{ color: "#8899A8", fontSize: 12, marginTop: 8, lineHeight: 1.45 }}>
                    {stops.slice(0, 5).join(" - ")}{stops.length > 5 ? " ..." : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span style={{ color: "#EAECF0", fontSize: 22, fontWeight: 900 }}>{estimateEta(route, index)}</span>
                  <span style={{ color: "#4A6070", fontSize: 11 }}> min</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => onShowMap(from, to)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl"
                  style={{ background: "#2FA4D7", color: "#000", fontSize: 14, fontWeight: 800 }}
                >
                  <Map size={15} />
                  Show Map
                </button>
                <button
                  onClick={() => openInMaps(from, to)}
                  className="w-12 flex items-center justify-center rounded-xl"
                  style={{ background: "#233D4D", border: "1px solid #1C3344" }}
                  title="Open in Google Maps"
                >
                  <ExternalLink size={15} color="#2FA4D7" />
                </button>
              </div>
            </article>
          );
        })}

        {results.length === 0 && (
          <div className="rounded-2xl p-5" style={{ background: "#0E1E2A", border: "1px solid #1C3344" }}>
            <p style={{ color: "#8899A8", fontSize: 13 }}>No routes match this filter yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
