import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { VehicleType } from "../App";

// Waypoints on a 390x600 viewBox representing Metro Manila transit network
const WP: Record<string, number[][]> = {
  mrt3: [
    [165, 22], [178, 52], [192, 82], [206, 110], [222, 140],
    [238, 168], [250, 192], [262, 218], [266, 248], [264, 278],
    [258, 308], [248, 332], [234, 356], [220, 380], [206, 402], [188, 428],
  ],
  lrt1: [
    [88, 22], [91, 70], [94, 120], [97, 178], [101, 240],
    [105, 300], [109, 360], [115, 418], [120, 460],
  ],
  lrt2: [
    [330, 162], [292, 175], [248, 190], [204, 206], [156, 220], [110, 232],
  ],
  jeep1: [
    [238, 168], [218, 180], [196, 192], [172, 202], [148, 210], [122, 218], [102, 224],
  ],
  jeep2: [
    [186, 430], [196, 408], [210, 388], [226, 368], [240, 350], [252, 332],
  ],
  jeep3: [
    [210, 402], [228, 383], [242, 362], [256, 340], [265, 318], [268, 298],
  ],
  bus1: [
    [165, 22], [188, 88], [212, 148], [252, 218], [266, 280], [250, 352], [218, 410], [186, 450],
  ],
  uv1: [
    [272, 388], [284, 408], [298, 428], [314, 446], [325, 462],
  ],
};

interface VehicleDef {
  id: string;
  type: VehicleType;
  route: string;
  startIdx: number;
}

const VEHICLE_DEFS: VehicleDef[] = [
  { id: "mrt3_a", type: "train", route: "mrt3", startIdx: 3 },
  { id: "mrt3_b", type: "train", route: "mrt3", startIdx: 10 },
  { id: "lrt1_a", type: "train", route: "lrt1", startIdx: 2 },
  { id: "lrt2_a", type: "train", route: "lrt2", startIdx: 1 },
  { id: "jeep1", type: "jeepney", route: "jeep1", startIdx: 0 },
  { id: "jeep2", type: "jeepney", route: "jeep2", startIdx: 1 },
  { id: "jeep3", type: "jeepney", route: "jeep3", startIdx: 2 },
  { id: "bus1", type: "bus", route: "bus1", startIdx: 3 },
  { id: "uv1", type: "uvexpress", route: "uv1", startIdx: 0 },
];

const MRT3_STATIONS = [
  [165, 22], [206, 110], [238, 168], [250, 192], [262, 218],
  [266, 248], [264, 278], [258, 308], [248, 332], [234, 356],
  [220, 380], [188, 428],
];
const LRT1_STATIONS = [[88, 22], [91, 70], [94, 120], [97, 178], [101, 240], [105, 300], [109, 360], [115, 418], [120, 460]];
const LRT2_STATIONS = [[330, 162], [292, 175], [248, 190], [204, 206], [156, 220], [110, 232]];

const HEAT_SPOTS = [
  { x: 250, y: 192, r: 38, color: "255,50,50", o: 0.18 },
  { x: 262, y: 218, r: 30, color: "255,140,50", o: 0.15 },
  { x: 101, y: 240, r: 26, color: "255,200,50", o: 0.13 },
  { x: 234, y: 356, r: 34, color: "255,50,50", o: 0.17 },
  { x: 165, y: 22, r: 22, color: "50,255,100", o: 0.1 },
  { x: 88, y: 22, r: 20, color: "50,255,100", o: 0.1 },
  { x: 188, y: 428, r: 28, color: "255,100,50", o: 0.14 },
  { x: 330, y: 162, r: 24, color: "50,255,100", o: 0.1 },
  { x: 266, y: 280, r: 22, color: "255,200,50", o: 0.11 },
];

interface Props {
  showHeatmap: boolean;
  activeFilters: string[];
  onVehicleClick: (vehicleId: string) => void;
}

export function MetroMap({ showHeatmap, activeFilters, onVehicleClick }: Props) {
  const [idxMap, setIdxMap] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    VEHICLE_DEFS.forEach((v) => { m[v.id] = v.startIdx; });
    return m;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setIdxMap((prev) => {
        const next = { ...prev };
        VEHICLE_DEFS.forEach((v) => {
          next[v.id] = (prev[v.id] + 1) % WP[v.route].length;
        });
        return next;
      });
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const getXY = (v: VehicleDef) => {
    const pt = WP[v.route][idxMap[v.id]];
    return { x: pt[0], y: pt[1] };
  };

  const visible = (type: VehicleType) => {
    const map: Record<VehicleType, string> = {
      train: "train", bus: "bus", jeepney: "jeepney", uvexpress: "uvexpress",
    };
    return activeFilters.includes(map[type]);
  };

  return (
    <svg viewBox="0 0 390 600" width="100%" height="100%" style={{ display: "block" }}>
      {/* ── BACKGROUND ── */}
      <rect width="390" height="600" fill="#0B1C28" />

      {/* Manila Bay */}
      <path
        d="M 0,210 C 22,192 58,188 80,202 C 94,212 92,255 86,328 C 78,408 66,490 50,565 L 0,565 Z"
        fill="#071219"
      />
      {/* Laguna hint */}
      <path
        d="M 390,275 C 374,264 364,272 360,286 C 356,308 360,340 368,360 C 374,378 384,384 390,380 Z"
        fill="#071219"
        opacity="0.55"
      />

      {/* ── STREET GRID ── */}
      {Array.from({ length: 21 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 30} x2="390" y2={i * 30} stroke="#0D2233" strokeWidth="0.7" />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <line key={`v${i}`} x1={i * 30} y1="0" x2={i * 30} y2="600" stroke="#0D2233" strokeWidth="0.7" />
      ))}

      {/* ── MAJOR ROADS ── */}
      {/* EDSA */}
      <path
        d="M 165,22 C 175,52 192,82 208,110 C 228,145 254,185 265,220 C 275,252 272,282 264,308 C 254,338 240,360 226,382 C 212,402 198,422 184,450"
        stroke="#193244"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      {/* C-5 */}
      <path d="M 312,0 L 316,120 L 320,280 L 326,462" stroke="#122030" strokeWidth="5" fill="none" />
      {/* Taft Ave */}
      <path d="M 118,242 L 120,342 L 122,444 L 124,524" stroke="#122030" strokeWidth="5" fill="none" />
      {/* España */}
      <path d="M 88,120 L 148,118 L 198,114 L 242,110" stroke="#0E1C2A" strokeWidth="3.5" fill="none" />
      {/* Quezon Ave */}
      <path d="M 88,70 L 136,68 L 178,65 L 222,62" stroke="#0E1C2A" strokeWidth="3.5" fill="none" />
      {/* Ortigas */}
      <path d="M 248,190 L 290,195 L 330,198" stroke="#0E1C2A" strokeWidth="3" fill="none" />
      {/* Ayala Ave */}
      <path d="M 248,332 L 290,338 L 330,342" stroke="#0E1C2A" strokeWidth="3" fill="none" />
      {/* BGC connector */}
      <path d="M 268,388 L 310,392 L 352,388" stroke="#0E1C2A" strokeWidth="3" fill="none" />

      {/* ── TRANSIT LINES ── */}
      {/* LRT-1 red */}
      <path
        d="M 88,22 L 91,70 L 94,120 L 97,178 L 101,240 L 105,300 L 109,360 L 115,418 L 120,460"
        stroke="#C0392B"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* MRT-3 blue */}
      <path
        d="M 165,22 C 175,52 192,82 208,110 C 228,145 254,185 265,220 C 275,252 272,282 264,308 C 254,338 240,360 226,382 C 212,402 198,422 184,450"
        stroke="#2E86C1"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* LRT-2 purple */}
      <path
        d="M 330,162 L 292,175 L 248,190 L 204,206 L 156,220 L 110,232"
        stroke="#7D3C98"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Jeepney routes dashed green */}
      <path
        d="M 238,168 L 218,180 L 196,192 L 172,202 L 148,210 L 122,218 L 102,224"
        stroke="#1E8449"
        strokeWidth="2"
        fill="none"
        strokeDasharray="7,5"
        strokeLinecap="round"
      />
      <path
        d="M 186,430 L 196,408 L 210,388 L 226,368 L 240,350 L 252,332"
        stroke="#1E8449"
        strokeWidth="2"
        fill="none"
        strokeDasharray="7,5"
        strokeLinecap="round"
      />
      <path
        d="M 210,402 L 228,382 L 242,362 L 256,340 L 265,318 L 268,298"
        stroke="#1E8449"
        strokeWidth="2"
        fill="none"
        strokeDasharray="7,5"
        strokeLinecap="round"
      />

      {/* UV Express dashed yellow */}
      <path
        d="M 272,388 L 284,408 L 298,428 L 314,446 L 325,462"
        stroke="#D4AC0D"
        strokeWidth="2"
        fill="none"
        strokeDasharray="7,5"
        strokeLinecap="round"
      />

      {/* Bus routes dotted amber */}
      <path
        d="M 165,22 L 188,88 L 212,148 L 252,218 L 266,280 L 250,352 L 218,410 L 186,450"
        stroke="#BA4A00"
        strokeWidth="1.8"
        fill="none"
        strokeDasharray="4,7"
        strokeLinecap="round"
      />

      {/* ── STATION DOTS ── */}
      {MRT3_STATIONS.map(([x, y], i) => (
        <circle key={`m3s${i}`} cx={x} cy={y} r={3.5} fill="#2E86C1" stroke="#0B1C28" strokeWidth={1.5} />
      ))}
      {LRT1_STATIONS.map(([x, y], i) => (
        <circle key={`l1s${i}`} cx={x} cy={y} r={3.5} fill="#C0392B" stroke="#0B1C28" strokeWidth={1.5} />
      ))}
      {LRT2_STATIONS.map(([x, y], i) => (
        <circle key={`l2s${i}`} cx={x} cy={y} r={3.5} fill="#7D3C98" stroke="#0B1C28" strokeWidth={1.5} />
      ))}

      {/* ── STATION LABELS ── */}
      <text x="254" y="188" fontSize="7.5" fill="#EAECF0" opacity="0.5" fontFamily="Inter,sans-serif">Cubao</text>
      <text x="268" y="218" fontSize="7.5" fill="#EAECF0" opacity="0.5" fontFamily="Inter,sans-serif">Ortigas</text>
      <text x="270" y="250" fontSize="7.5" fill="#EAECF0" opacity="0.5" fontFamily="Inter,sans-serif">Shaw</text>
      <text x="260" y="310" fontSize="7.5" fill="#EAECF0" opacity="0.5" fontFamily="Inter,sans-serif">Guadalupe</text>
      <text x="248" y="334" fontSize="7.5" fill="#EAECF0" opacity="0.5" fontFamily="Inter,sans-serif">Buendia</text>
      <text x="236" y="358" fontSize="7.5" fill="#EAECF0" opacity="0.5" fontFamily="Inter,sans-serif">Ayala</text>
      <text x="168" y="456" fontSize="7.5" fill="#EAECF0" opacity="0.5" fontFamily="Inter,sans-serif">Taft</text>
      <text x="122" y="468" fontSize="7.5" fill="#EAECF0" opacity="0.5" fontFamily="Inter,sans-serif">Baclaran</text>
      <text x="334" y="160" fontSize="7.5" fill="#EAECF0" opacity="0.5" fontFamily="Inter,sans-serif">Santolan</text>
      <text x="90" y="228" fontSize="7.5" fill="#EAECF0" opacity="0.5" fontFamily="Inter,sans-serif">Recto</text>
      <text x="160" y="18" fontSize="7.5" fill="#EAECF0" opacity="0.5" fontFamily="Inter,sans-serif">Monumento</text>

      {/* ── DISTRICT LABELS ── */}
      <text x="172" y="72" fontSize="8.5" fill="#EAECF0" opacity="0.18" fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="1">QUEZON CITY</text>
      <text x="108" y="288" fontSize="8.5" fill="#EAECF0" opacity="0.18" fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="1">MANILA</text>
      <text x="222" y="302" fontSize="8.5" fill="#EAECF0" opacity="0.18" fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="1">MAKATI</text>
      <text x="280" y="448" fontSize="7.5" fill="#EAECF0" opacity="0.15" fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="1">BGC</text>
      <text x="20" y="355" fontSize="7.5" fill="#EAECF0" opacity="0.15" fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="1">PASAY</text>

      {/* ── CROWD HEATMAP ── */}
      {showHeatmap && HEAT_SPOTS.map((s, i) => (
        <circle key={`hs${i}`} cx={s.x} cy={s.y} r={s.r} fill={`rgba(${s.color},${s.o})`} />
      ))}

      {/* ── USER LOCATION ── */}
      <circle cx={222} cy={140} r={8} fill="none" stroke="#3498DB" strokeWidth={2} opacity={0.5}>
        <animate attributeName="r" values="8;22" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={222} cy={140} r={5.5} fill="#3498DB" stroke="white" strokeWidth={2} />

      {/* ── VEHICLE MARKERS ── */}
      {VEHICLE_DEFS.filter((v) => visible(v.type)).map((v) => {
        const { x, y } = getXY(v);
        return (
          <g key={v.id} onClick={() => onVehicleClick(v.id)} style={{ cursor: "pointer" }}>
            {/* Pulse ring (SMIL animated) */}
            <circle cx={x} cy={y} r={7} fill="none" stroke="#2FA4D7" strokeWidth={2} opacity={0.8}>
              <animate attributeName="r" values="7;28" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur="1.6s" repeatCount="indefinite" />
            </circle>
            {/* Moving dot */}
            <motion.circle
              initial={{ cx: x, cy: y }}
              animate={{ cx: x, cy: y }}
              transition={{ duration: 1.9, ease: "easeInOut" }}
              r={8}
              fill="#2FA4D7"
              stroke="#0B1C28"
              strokeWidth={1.5}
            />
            {/* Vehicle type icon */}
            <motion.text
              initial={{ x, y: y + 1 }}
              animate={{ x, y: y + 1 }}
              transition={{ duration: 1.9, ease: "easeInOut" }}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8"
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              {v.type === "train" ? "🚃" : v.type === "bus" ? "🚌" : v.type === "uvexpress" ? "🚐" : "🚙"}
            </motion.text>
          </g>
        );
      })}
    </svg>
  );
}
