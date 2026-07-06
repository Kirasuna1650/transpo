import { useState } from "react";
import { ArrowRight, Bookmark, Clock, Map, Plus, Star, Trash2 } from "lucide-react";
import { POPULAR_ROUTE_PAIRS, ROUTES_BY_ID } from "../data/routes";

interface SavedRoute {
  id: string;
  name: string;
  from: string;
  to: string;
  mode: string;
  badge: string;
  eta: number;
  favorite: boolean;
}

interface Props {
  onShowMap: (from: string, to: string) => void;
}

const INITIAL_ROUTES: SavedRoute[] = POPULAR_ROUTE_PAIRS.slice(0, 4).map((pair, index) => {
  const route = ROUTES_BY_ID.get(pair.routeId);
  return {
    id: pair.routeId,
    name: route?.name || `${pair.from} to ${pair.to}`,
    from: pair.from,
    to: pair.to,
    mode: route?.mode || "Route",
    badge: route?.vehicleType === "bus" ? "BUS" : route?.vehicleType === "train" ? "MRT" : route?.vehicleType === "uvexpress" ? "UV" : "PUJ",
    eta: 24 + index * 8,
    favorite: index < 2,
  };
});

export function SavedRoutesScreen({ onShowMap }: Props) {
  const [routes, setRoutes] = useState(INITIAL_ROUTES);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");

  const toggleFav = (id: string) => {
    setRoutes((items) => items.map((route) => route.id === id ? { ...route, favorite: !route.favorite } : route));
  };

  const deleteRoute = (id: string) => {
    setRoutes((items) => items.filter((route) => route.id !== id));
  };

  const addRoute = () => {
    if (!newFrom || !newTo) return;
    setRoutes((items) => [
      ...items,
      {
        id: `custom-${Date.now()}`,
        name: newName || `${newFrom} to ${newTo}`,
        from: newFrom,
        to: newTo,
        mode: "Custom",
        badge: "NEW",
        eta: 0,
        favorite: false,
      },
    ]);
    setNewName("");
    setNewFrom("");
    setNewTo("");
    setShowAdd(false);
  };

  const favRoutes = routes.filter((route) => route.favorite);
  const otherRoutes = routes.filter((route) => !route.favorite);

  const renderCard = (route: SavedRoute) => (
    <div key={route.id} className="rounded-2xl overflow-hidden" style={{ background: "#0E1E2A", border: "1px solid #1C3344" }}>
      <div className="p-3.5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#233D4D", color: "#2FA4D7", fontSize: 11, fontWeight: 800 }}>
            {route.badge}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate" style={{ color: "#EAECF0", fontSize: 14, fontWeight: 700 }}>{route.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="truncate" style={{ color: "#8899A8", fontSize: 12 }}>{route.from}</span>
              <ArrowRight size={10} color="#3A5060" />
              <span className="truncate" style={{ color: "#8899A8", fontSize: 12 }}>{route.to}</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1">
                <Clock size={10} color="#4A6070" />
                <span style={{ color: "#4A6070", fontSize: 11 }}>{route.eta || "--"} min</span>
              </div>
              <span style={{ color: "#2A4050", fontSize: 11 }}>-</span>
              <span style={{ color: "#4A6070", fontSize: 11 }}>{route.mode}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 items-end shrink-0">
            <button onClick={() => toggleFav(route.id)}>
              <Star size={16} color={route.favorite ? "#2FA4D7" : "#2A4050"} fill={route.favorite ? "#2FA4D7" : "none"} />
            </button>
            <button onClick={() => deleteRoute(route.id)}>
              <Trash2 size={14} color="#2A4050" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end">
          <button
            onClick={() => onShowMap(route.from, route.to)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "#2FA4D7", color: "#000", fontSize: 11, fontWeight: 700 }}
          >
            <Map size={11} />
            Go
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: "#000" }}>
      <div className="shrink-0 pt-10 px-4 pb-4 flex items-center justify-between">
        <div>
          <h1 style={{ color: "#EAECF0", fontSize: 22, fontWeight: 800 }}>Saved Routes</h1>
          <p style={{ color: "#3A5060", fontSize: 12 }}>{routes.length} route(s) saved</p>
        </div>
        <button
          onClick={() => setShowAdd((value) => !value)}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "#2FA4D7", boxShadow: "0 0 16px rgba(47,164,215,0.4)" }}
        >
          <Plus size={20} color="#000" />
        </button>
      </div>

      {showAdd && (
        <div className="shrink-0 mx-4 mb-4 p-4 rounded-2xl" style={{ background: "#0E1E2A", border: "1px solid #2FA4D744" }}>
          <p style={{ color: "#EAECF0", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Add New Route</p>
          {[
            { label: "Route Name", value: newName, setValue: setNewName, placeholder: "Optional name" },
            { label: "From", value: newFrom, setValue: setNewFrom, placeholder: "Origin" },
            { label: "To", value: newTo, setValue: setNewTo, placeholder: "Destination" },
          ].map(({ label, value, setValue, placeholder }) => (
            <div key={label} className="mb-2">
              <p style={{ color: "#4A6070", fontSize: 10, fontWeight: 600, marginBottom: 4 }}>{label}</p>
              <input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={placeholder}
                style={{
                  width: "100%",
                  background: "#233D4D",
                  border: "1px solid #1C3344",
                  borderRadius: 10,
                  color: "#EAECF0",
                  padding: "10px 12px",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
          ))}
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl" style={{ background: "#233D4D", color: "#8899A8", fontSize: 13 }}>
              Cancel
            </button>
            <button onClick={addRoute} className="flex-1 py-2.5 rounded-xl" style={{ background: "#2FA4D7", color: "#000", fontSize: 13, fontWeight: 700 }}>
              Save Route
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
        {routes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 mt-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#0E1E2A", border: "1px solid #1C3344" }}>
              <Bookmark size={28} color="#2A4050" />
            </div>
            <p style={{ color: "#3A5060", fontSize: 14 }}>No saved routes yet</p>
          </div>
        ) : (
          <>
            {favRoutes.length > 0 && (
              <>
                <p style={{ color: "#3A5060", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Favorites</p>
                {favRoutes.map(renderCard)}
              </>
            )}
            {otherRoutes.length > 0 && (
              <>
                <p style={{ color: "#3A5060", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 4 }}>Other Routes</p>
                {otherRoutes.map(renderCard)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
