import { motion } from "motion/react";

export function SplashScreen() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden" style={{ background: "#000" }}>
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 280px 280px at 50% 48%, rgba(254,127,45,0.18) 0%, transparent 70%)",
        }}
      />
      {/* City grid lines (subtle) */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="absolute w-full h-px" style={{ background: "#FE7F2D", top: `${12 * i + 8}%` }} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="absolute h-full w-px" style={{ background: "#FE7F2D", left: `${18 * i + 4}%` }} />
        ))}
      </div>

      {/* App icon */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col items-center gap-5"
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 0 24px rgba(254,127,45,0.4)",
              "0 0 52px rgba(254,127,45,0.75)",
              "0 0 24px rgba(254,127,45,0.4)",
            ],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 rounded-[28px] flex items-center justify-center"
          style={{ background: "linear-gradient(145deg, #FF9442, #E05A00)" }}
        >
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect x="6" y="18" width="44" height="22" rx="5" fill="white" fillOpacity="0.92" />
            <rect x="9" y="22" width="38" height="10" rx="2" fill="white" fillOpacity="0.25" />
            <circle cx="15" cy="44" r="5" fill="white" />
            <circle cx="41" cy="44" r="5" fill="white" />
            <rect x="26" y="10" width="4" height="10" rx="2" fill="white" />
            <circle cx="28" cy="8" r="3" fill="white" opacity="0.7" />
            <path d="M18 26h4M26 26h4M34 26h4" stroke="#E05A00" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.div>

        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ color: "#EAECF0", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px" }}
          >
            Transpo
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{ color: "#FE7F2D", fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", marginTop: 2 }}
          >
            Metro Manila Transit
          </motion.p>
        </div>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-24 flex gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.2, delay: i * 0.22, repeat: Infinity }}
            className="w-2 h-2 rounded-full"
            style={{ background: "#FE7F2D" }}
          />
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="absolute bottom-10"
        style={{ color: "#2A4050", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase" }}
      >
        Real-time Transit · Metro Manila
      </motion.p>
    </div>
  );
}
