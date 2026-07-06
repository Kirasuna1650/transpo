import { useState, useEffect } from "react";
import { ChevronLeft, Bell, BellOff, MapPin, Users, Clock, CheckCircle2, Circle } from "lucide-react";
import { Vehicle } from "../App";
import { motion } from "motion/react";

const CAP_COLOR: Record<string, string> = {
  available: "#27AE60",
  limited: "#F39C12",
  full: "#C0392B",
};
const CAP_LABEL: Record<string, string> = {
  available: "Available",
  limited: "Limited Seats",
  full: "Full",
};

interface Props {
  vehicle: Vehicle;
  onBack: () => void;
}

export function LiveTrackingScreen({ vehicle, onBack }: Props) {
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [eta, setEta] = useState(vehicle.eta);
  const pct = vehicle.occupancy / vehicle.maxOccupancy;

  // Simulate ETA countdown
  useEffect(() => {
    if (eta <= 0) return;
    const t = setInterval(() => setEta((e) => Math.max(0, e - 1)), 30000);
    return () => clearInterval(t);
  }, [eta]);

  const progressPct = (vehicle.currentStop / (vehicle.stops.length - 1)) * 100;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: "#000" }}>
      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-3 pt-10 pb-3 px-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "#233D4D", border: "1px solid #1C3344" }}
        >
          <ChevronLeft size={20} color="#EAECF0" />
        </button>
        <div className="flex-1">
          <p style={{ color: "#4A6070", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Live Tracking
          </p>
          <h2 style={{ color: "#EAECF0", fontSize: 16, fontWeight: 700, marginTop: 1 }}>{vehicle.routeName}</h2>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
          style={{ background: "#2FA4D722", border: "1px solid #2FA4D744" }}
        >
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="w-2 h-2 rounded-full"
            style={{ background: "#2FA4D7" }}
          />
          <span style={{ color: "#2FA4D7", fontSize: 11, fontWeight: 700 }}>LIVE</span>
        </div>
      </div>

      {/* Mini map area */}
      <div
        className="shrink-0 mx-4 rounded-2xl overflow-hidden relative"
        style={{ height: 170, background: "#0B1C28", border: "1px solid #1C3344" }}
      >
        {/* Simulated mini route line */}
        <svg width="100%" height="100%" viewBox="0 0 340 170">
          {/* Route path */}
          <path
            d="M 30,85 Q 80,40 140,60 Q 200,80 250,55 Q 300,30 320,85"
            stroke="#1A3348"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 30,85 Q 80,40 140,60 Q 200,80 250,55 Q 300,30 320,85"
            stroke="#2E86C1"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {/* Stop markers */}
          {vehicle.stops.map((stop, i) => {
            const pctPos = i / (vehicle.stops.length - 1);
            const x = 30 + pctPos * 290;
            const isPassed = i <= vehicle.currentStop;
            return (
              <g key={i}>
                <circle cx={x} cy={70} r={5} fill={isPassed ? "#2FA4D7" : "#233D4D"} stroke="#0B1C28" strokeWidth={1.5} />
                {i === vehicle.currentStop + 1 && (
                  <text x={x} y={58} textAnchor="middle" fontSize="8" fill="#EAECF0" opacity={0.7} fontFamily="Inter,sans-serif">
                    Next
                  </text>
                )}
              </g>
            );
          })}

          {/* Vehicle marker (animated) */}
          <motion.g
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle
              cx={30 + (vehicle.currentStop / (vehicle.stops.length - 1)) * 290}
              cy={70}
              r={7}
              fill="none"
              stroke="#2FA4D7"
              strokeWidth={2}
              opacity={0.6}
            >
              <animate attributeName="r" values="7;20" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <circle
              cx={30 + (vehicle.currentStop / (vehicle.stops.length - 1)) * 290}
              cy={70}
              r={9}
              fill="#2FA4D7"
              stroke="#0B1C28"
              strokeWidth={1.5}
            />
            <text
              x={30 + (vehicle.currentStop / (vehicle.stops.length - 1)) * 290}
              y={71}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
            >
              {vehicle.emoji}
            </text>
          </motion.g>

          {/* Labels */}
          <text x="30" y="90" textAnchor="middle" fontSize="8" fill="#4A6070" fontFamily="Inter,sans-serif">
            {vehicle.stops[0].split(" ")[0]}
          </text>
          <text x="320" y="98" textAnchor="middle" fontSize="8" fill="#4A6070" fontFamily="Inter,sans-serif">
            {vehicle.stops[vehicle.stops.length - 1].split(" ")[0]}
          </text>
        </svg>

        {/* ETA badge overlay */}
        <div
          className="absolute top-3 right-3 px-3 py-1.5 rounded-xl"
          style={{ background: "rgba(47,164,215,0.95)" }}
        >
          <span style={{ color: "#000", fontSize: 13, fontWeight: 800 }}>{eta} min away</span>
        </div>
      </div>

      {/* Info cards */}
      <div className="shrink-0 mx-4 mt-3 grid grid-cols-3 gap-2.5">
        {/* ETA */}
        <div className="rounded-2xl p-3 flex flex-col gap-1" style={{ background: "#0E1E2A", border: "1px solid #1C3344" }}>
          <Clock size={16} color="#2FA4D7" />
          <span style={{ color: "#EAECF0", fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{eta}</span>
          <span style={{ color: "#4A6070", fontSize: 10 }}>min ETA</span>
        </div>

        {/* Capacity */}
        <div className="rounded-2xl p-3 flex flex-col gap-1" style={{ background: "#0E1E2A", border: "1px solid #1C3344" }}>
          <Users size={16} color={CAP_COLOR[vehicle.capacity]} />
          <div className="flex items-end gap-0.5">
            <span style={{ color: "#EAECF0", fontSize: 14, fontWeight: 800, lineHeight: 1 }}>{vehicle.occupancy}</span>
            <span style={{ color: "#4A6070", fontSize: 9, marginBottom: 1 }}>/{vehicle.maxOccupancy}</span>
          </div>
          <span style={{ color: CAP_COLOR[vehicle.capacity], fontSize: 10, fontWeight: 600 }}>
            {CAP_LABEL[vehicle.capacity]}
          </span>
        </div>

        {/* Distance */}
        <div className="rounded-2xl p-3 flex flex-col gap-1" style={{ background: "#0E1E2A", border: "1px solid #1C3344" }}>
          <MapPin size={16} color="#2E86C1" />
          <span style={{ color: "#EAECF0", fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{vehicle.distance.split(" ")[0]}</span>
          <span style={{ color: "#4A6070", fontSize: 10 }}>km away</span>
        </div>
      </div>

      {/* Capacity bar */}
      <div className="mx-4 mt-3 p-3.5 rounded-2xl" style={{ background: "#0E1E2A", border: "1px solid #1C3344" }}>
        <div className="flex justify-between mb-2">
          <span style={{ color: "#8899A8", fontSize: 12 }}>Occupancy Level</span>
          <span style={{ color: "#EAECF0", fontSize: 12, fontWeight: 600 }}>
            {Math.round(pct * 100)}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1A2E3D" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct * 100}%`,
              background: pct < 0.6 ? "#27AE60" : pct < 0.85 ? "#F39C12" : "#C0392B",
              transition: "width 0.5s ease",
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span style={{ color: "#27AE60", fontSize: 10 }}>Empty</span>
          <span style={{ color: "#C0392B", fontSize: 10 }}>Full</span>
        </div>
      </div>

      {/* Notify toggle */}
      <div
        className="mx-4 mt-3 p-3.5 rounded-2xl flex items-center justify-between"
        style={{ background: "#0E1E2A", border: "1px solid #1C3344" }}
      >
        <div className="flex items-center gap-3">
          {notifyEnabled ? (
            <Bell size={18} color="#2FA4D7" />
          ) : (
            <BellOff size={18} color="#4A6070" />
          )}
          <div>
            <p style={{ color: "#EAECF0", fontSize: 13, fontWeight: 600 }}>Notify when near</p>
            <p style={{ color: "#4A6070", fontSize: 11 }}>Alert me when vehicle is 2 stops away</p>
          </div>
        </div>
        <button
          onClick={() => setNotifyEnabled((s) => !s)}
          className="w-12 h-6 rounded-full relative"
          style={{ background: notifyEnabled ? "#2FA4D7" : "#233D4D", transition: "background 0.2s" }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full"
            style={{
              background: "#fff",
              left: notifyEnabled ? "calc(100% - 22px)" : 2,
              transition: "left 0.2s",
            }}
          />
        </button>
      </div>

      {/* Stops list */}
      <div className="flex-1 mx-4 mt-3 overflow-y-auto">
        <p style={{ color: "#4A6070", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
          Route Stops
        </p>
        <div className="flex flex-col gap-0">
          {vehicle.stops.map((stop, i) => {
            const isPassed = i < vehicle.currentStop;
            const isCurrent = i === vehicle.currentStop;
            const isNext = i === vehicle.currentStop + 1;
            return (
              <div key={i} className="flex items-start gap-3 pb-2">
                {/* Line + dot */}
                <div className="flex flex-col items-center" style={{ width: 24 }}>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: isCurrent ? "#2FA4D7" : isPassed ? "#27AE60" : "#1A2E3D",
                      border: isCurrent ? "none" : `1px solid ${isPassed ? "#27AE60" : "#2A4050"}`,
                    }}
                  >
                    {isCurrent ? (
                      <span style={{ fontSize: 10 }}>{vehicle.emoji}</span>
                    ) : isPassed ? (
                      <CheckCircle2 size={12} color="#fff" />
                    ) : (
                      <Circle size={10} color="#2A4050" />
                    )}
                  </div>
                  {i < vehicle.stops.length - 1 && (
                    <div
                      className="w-0.5 flex-1 mt-1"
                      style={{ minHeight: 16, background: isPassed ? "#27AE6066" : "#1A2E3D" }}
                    />
                  )}
                </div>
                <div className="pt-0.5 pb-2">
                  <p style={{
                    color: isCurrent ? "#2FA4D7" : isPassed ? "#4A6070" : "#EAECF0",
                    fontSize: isCurrent ? 14 : 13,
                    fontWeight: isCurrent ? 700 : 400,
                  }}>
                    {stop}
                  </p>
                  {isCurrent && (
                    <span style={{ color: "#2FA4D7", fontSize: 10, fontWeight: 600 }}>Current location</span>
                  )}
                  {isNext && (
                    <span style={{ color: "#4A90D9", fontSize: 10 }}>Next stop • ~{eta} min</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
