import { X, Navigation, ExternalLink, ArrowRight } from "lucide-react";

// Approximate SVG coordinates for key Metro Manila locations (viewBox 390×600)
const LOCATION_COORDS: Record<string, [number, number]> = {
  "EDSA Carousel": [165, 22],
  "Monumento": [165, 22],
  "Cubao": [238, 168],
  "Araneta-Cubao": [238, 168],
  "Makati CBD": [248, 332],
  "Makati": [248, 332],
  "Ayala": [248, 332],
  "Taft Avenue": [184, 450],
  "Taft": [184, 450],
  "Buendia": [258, 308],
  "Divisoria": [112, 235],
  "Quezon City": [195, 75],
  "Ortigas": [250, 192],
  "BGC": [310, 390],
  "High Street": [320, 395],
  "BGC Bus Bay": [310, 390],
  "España, Manila": [145, 118],
  "España": [145, 118],
  "Quiapo": [115, 248],
  "Recto": [112, 232],
  "Shaw": [262, 218],
  "Guadalupe": [258, 280],
  "Santolan": [302, 162],
  "Katipunan": [285, 175],
  "Baclaran": [120, 460],
  "Aurora Blvd": [210, 180],
  "Home": [195, 75],
  "School": [145, 118],
};

function getCoords(location: string): [number, number] {
  if (LOCATION_COORDS[location]) return LOCATION_COORDS[location];
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (
      location.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(location.toLowerCase())
    ) {
      return coords;
    }
  }
  return [200, 280]; // Metro Manila center fallback
}

function buildRoutePath(a: [number, number], b: [number, number]): string {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const offset = Math.min(len * 0.22, 48);
  const cx = mx - (dy / len) * offset;
  const cy = my + (dx / len) * offset;
  return `M ${a[0]},${a[1]} Q ${cx},${cy} ${b[0]},${b[1]}`;
}

function openInGoogleMaps(from: string, to: string) {
  const origin = encodeURIComponent(`${from}, Metro Manila, Philippines`);
  const dest = encodeURIComponent(`${to}, Metro Manila, Philippines`);
  window.open(
    `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=transit`,
    "_blank",
    "noopener,noreferrer"
  );
}

interface Props {
  from: string;
  to: string;
  onClose: () => void;
}

export function RouteMapModal({ from, to, onClose }: Props) {
  const fromCoords = getCoords(from);
  const toCoords = getCoords(to);
  const routePath = buildRoutePath(fromCoords, toCoords);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: "#000", zIndex: 50 }}>
      {/* Header */}
      <div
        className="shrink-0 flex items-center gap-3 pt-10 pb-3 px-4"
        style={{ background: "#000", borderBottom: "1px solid #1C3344" }}
      >
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#233D4D", border: "1px solid #1C3344" }}
        >
          <X size={18} color="#EAECF0" />
        </button>
        <div className="flex-1 min-w-0">
          <p style={{ color: "#4A6070", fontSize: 11 }}>Route Preview</p>
          <div className="flex items-center gap-1.5 min-w-0">
            <span style={{ color: "#2FA4D7", fontSize: 13, fontWeight: 700 }} className="truncate">
              {from}
            </span>
            <ArrowRight size={12} color="#4A6070" className="shrink-0" />
            <span style={{ color: "#EAECF0", fontSize: 13, fontWeight: 700 }} className="truncate">
              {to}
            </span>
          </div>
        </div>
        <button
          onClick={() => openInGoogleMaps(from, to)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0"
          style={{ background: "#2FA4D722", border: "1px solid #2FA4D744", color: "#2FA4D7", fontSize: 12, fontWeight: 700 }}
        >
          <ExternalLink size={13} />
          G-Maps
        </button>
      </div>

      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
        <svg viewBox="0 0 390 600" width="100%" height="100%" style={{ display: "block" }}>
          {/* Background */}
          <rect width="390" height="600" fill="#0B1C28" />

          {/* Manila Bay */}
          <path
            d="M 0,210 C 22,192 58,188 80,202 C 94,212 92,255 86,328 C 78,408 66,490 50,565 L 0,565 Z"
            fill="#071219"
          />

          {/* Street grid */}
          {Array.from({ length: 21 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 30} x2="390" y2={i * 30} stroke="#0D2233" strokeWidth="0.7" />
          ))}
          {Array.from({ length: 14 }, (_, i) => (
            <line key={`v${i}`} x1={i * 30} y1="0" x2={i * 30} y2="600" stroke="#0D2233" strokeWidth="0.7" />
          ))}

          {/* Major roads */}
          <path
            d="M 165,22 C 175,52 192,82 208,110 C 228,145 254,185 265,220 C 275,252 272,282 264,308 C 254,338 240,360 226,382 C 212,402 198,422 184,450"
            stroke="#193244"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M 312,0 L 316,120 L 320,280 L 326,462" stroke="#122030" strokeWidth="4" fill="none" />
          <path d="M 118,242 L 120,342 L 122,444" stroke="#122030" strokeWidth="4" fill="none" />

          {/* Transit lines (dimmed) */}
          <path
            d="M 88,22 L 91,70 L 94,120 L 97,178 L 101,240 L 105,300 L 109,360 L 115,418 L 120,460"
            stroke="#C0392B"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d="M 165,22 C 175,52 192,82 208,110 C 228,145 254,185 265,220 C 275,252 272,282 264,308 C 254,338 240,360 226,382 C 212,402 198,422 184,450"
            stroke="#2E86C1"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d="M 330,162 L 292,175 L 248,190 L 204,206 L 156,220 L 110,232"
            stroke="#7D3C98"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* District labels */}
          <text x="172" y="70" fontSize="8" fill="#EAECF0" opacity="0.14" fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="1">QUEZON CITY</text>
          <text x="108" y="285" fontSize="8" fill="#EAECF0" opacity="0.14" fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="1">MANILA</text>
          <text x="222" y="298" fontSize="8" fill="#EAECF0" opacity="0.14" fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="1">MAKATI</text>
          <text x="280" y="448" fontSize="7" fill="#EAECF0" opacity="0.12" fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="1">BGC</text>

          {/* Route glow */}
          <path d={routePath} stroke="#2FA4D7" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.12" />
          <path d={routePath} stroke="#2FA4D7" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.25" />

          {/* Animated dashed route line */}
          <path
            d={routePath}
            stroke="#2FA4D7"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="12,7"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-190" dur="2.5s" repeatCount="indefinite" />
          </path>

          {/* FROM marker */}
          <circle cx={fromCoords[0]} cy={fromCoords[1]} r={14} fill="#2FA4D7" opacity="0.15" />
          <circle cx={fromCoords[0]} cy={fromCoords[1]} r={8} fill="#2FA4D7" stroke="#0B1C28" strokeWidth={2} />
          <circle cx={fromCoords[0]} cy={fromCoords[1]} r={3} fill="#fff" />
          <rect
            x={fromCoords[0] + 11}
            y={fromCoords[1] - 14}
            width={Math.max(from.split(" ")[0].length * 6, 32)}
            height={16}
            rx={4}
            fill="#2FA4D7"
          />
          <text
            x={fromCoords[0] + 11 + Math.max(from.split(" ")[0].length * 6, 32) / 2}
            y={fromCoords[1] - 4}
            fontSize="8"
            fill="#000"
            fontFamily="Inter,sans-serif"
            fontWeight="800"
            textAnchor="middle"
          >
            {from.split(" ")[0]}
          </text>

          {/* TO marker */}
          <circle cx={toCoords[0]} cy={toCoords[1]} r={14} fill="#27AE60" opacity="0.15" />
          <circle cx={toCoords[0]} cy={toCoords[1]} r={8} fill="#27AE60" stroke="#0B1C28" strokeWidth={2} />
          <circle cx={toCoords[0]} cy={toCoords[1]} r={3} fill="#fff" />
          <rect
            x={toCoords[0] + 11}
            y={toCoords[1] - 14}
            width={Math.max(to.split(" ")[0].length * 6, 32)}
            height={16}
            rx={4}
            fill="#27AE60"
          />
          <text
            x={toCoords[0] + 11 + Math.max(to.split(" ")[0].length * 6, 32) / 2}
            y={toCoords[1] - 4}
            fontSize="8"
            fill="#fff"
            fontFamily="Inter,sans-serif"
            fontWeight="800"
            textAnchor="middle"
          >
            {to.split(" ")[0]}
          </text>
        </svg>

        {/* Map legend overlay */}
        <div
          className="absolute bottom-4 left-4 flex flex-col gap-1.5 px-3 py-2.5 rounded-xl"
          style={{ background: "rgba(14,30,42,0.92)", border: "1px solid #1C3344", backdropFilter: "blur(8px)" }}
        >
          {[
            { color: "#2FA4D7", label: `From: ${from}` },
            { color: "#27AE60", label: `To: ${to}` },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span style={{ color: "#8899A8", fontSize: 11 }} className="truncate max-w-[160px]">
                {label}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 rounded" style={{ background: "repeating-linear-gradient(90deg, #2FA4D7 0, #2FA4D7 6px, transparent 6px, transparent 10px)" }} />
            <span style={{ color: "#8899A8", fontSize: 11 }}>Transit route</span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 p-4" style={{ background: "#0E1E2A", borderTop: "1px solid #1C3344" }}>
        <button
          onClick={() => openInGoogleMaps(from, to)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl"
          style={{ background: "#2FA4D7", color: "#000", fontSize: 15, fontWeight: 800 }}
        >
          <Navigation size={18} />
          Navigate in Google Maps
        </button>
      </div>
    </div>
  );
}
