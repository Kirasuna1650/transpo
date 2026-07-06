import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, MapPin, Clock, Users } from "lucide-react";

const SLIDES = [
  {
    Icon: MapPin,
    color: "#FE7F2D",
    bg: "rgba(254,127,45,0.12)",
    border: "rgba(254,127,45,0.3)",
    title: "Track in Real Time",
    subtitle: "See jeepneys, buses, trains, and UV Express move live on the map — always know where they are.",
    art: "🗺️",
  },
  {
    Icon: Clock,
    color: "#4A90D9",
    bg: "rgba(74,144,217,0.12)",
    border: "rgba(74,144,217,0.3)",
    title: "See ETA & Seat Space",
    subtitle: "Know exactly how many minutes your ride is away and whether there's room for you.",
    art: "⏱️",
  },
  {
    Icon: Users,
    color: "#2ECC71",
    bg: "rgba(46,204,113,0.12)",
    border: "rgba(46,204,113,0.3)",
    title: "Avoid the Crowd",
    subtitle: "Check crowd density at stops before you go — never waste time at a packed terminal again.",
    art: "📍",
  },
];

interface Props {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: Props) {
  const [slide, setSlide] = useState(0);
  const curr = SLIDES[slide];

  const next = () => {
    if (slide < SLIDES.length - 1) setSlide((s) => s + 1);
    else onComplete();
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: "#000" }}>
      {/* Skip */}
      <div className="flex justify-between items-center px-5 pt-10 pb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#FE7F2D22" }}>
          <span style={{ fontSize: 16 }}>🚌</span>
        </div>
        <button onClick={onComplete} style={{ color: "#4A6070", fontSize: 14 }}>
          Skip
        </button>
      </div>

      {/* Slide */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="flex flex-col items-center gap-7 text-center"
          >
            {/* Illustration */}
            <div
              className="w-36 h-36 rounded-3xl flex items-center justify-center relative overflow-hidden"
              style={{ background: curr.bg, border: `1.5px solid ${curr.border}` }}
            >
              {/* Glow */}
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse 80px 80px at 50% 50%, ${curr.color}30, transparent)`,
                }}
              />
              <curr.Icon size={64} color={curr.color} strokeWidth={1.4} />
            </div>

            <div className="flex flex-col gap-3">
              <h2 style={{ color: "#EAECF0", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px" }}>
                {curr.title}
              </h2>
              <p style={{ color: "#8899A8", fontSize: 15, lineHeight: 1.65 }}>{curr.subtitle}</p>
            </div>

            {/* Feature badges */}
            <div className="flex gap-2 flex-wrap justify-center">
              {slide === 0 && (
                <>
                  {["Jeepney", "Bus", "Train", "UV Express"].map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full"
                      style={{ background: "#FE7F2D22", color: "#FE7F2D", fontSize: 11, border: "1px solid #FE7F2D44" }}
                    >
                      {t}
                    </span>
                  ))}
                </>
              )}
              {slide === 1 && (
                <>
                  {["Live ETA", "Seat Count", "Arrival Alert"].map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full"
                      style={{ background: "#4A90D922", color: "#4A90D9", fontSize: 11, border: "1px solid #4A90D944" }}
                    >
                      {t}
                    </span>
                  ))}
                </>
              )}
              {slide === 2 && (
                <>
                  {["Heatmap", "Stop Density", "Low-Data Mode"].map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full"
                      style={{ background: "#2ECC7122", color: "#2ECC71", fontSize: 11, border: "1px solid #2ECC7144" }}
                    >
                      {t}
                    </span>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom */}
      <div className="px-6 pb-10 flex flex-col gap-5">
        {/* Progress dots */}
        <div className="flex gap-2 justify-center">
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === slide ? 28 : 8, opacity: i === slide ? 1 : 0.3 }}
              className="h-2 rounded-full"
              style={{ background: "#FE7F2D" }}
              transition={{ duration: 0.28 }}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-full flex items-center justify-center gap-2 py-[17px] rounded-2xl"
          style={{ background: "#FE7F2D", color: "#000", fontSize: 16, fontWeight: 800 }}
        >
          {slide < SLIDES.length - 1 ? (
            <>
              Next <ChevronRight size={20} />
            </>
          ) : (
            "Get Started"
          )}
        </button>
      </div>
    </div>
  );
}
