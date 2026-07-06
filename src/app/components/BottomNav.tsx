import { Map, Navigation, Bell, Bookmark, User } from "lucide-react";

type AppTab = "home" | "routes" | "notifications" | "saved" | "profile";

interface Props {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string; Icon: React.ElementType }[] = [
  { id: "home", label: "Map", Icon: Map },
  { id: "routes", label: "Routes", Icon: Navigation },
  { id: "notifications", label: "Alerts", Icon: Bell },
  { id: "saved", label: "Saved", Icon: Bookmark },
  { id: "profile", label: "Profile", Icon: User },
];

export function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <div
      className="flex shrink-0"
      style={{
        background: "#233D4D",
        borderTop: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 -8px 24px rgba(0,0,0,0.22)",
      }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex-1 flex flex-col items-center gap-1 py-3"
            style={{ position: "relative" }}
          >
            {active && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2"
                style={{
                  width: 28,
                  height: 3,
                  borderRadius: 1,
                  background: "#2FA4D7",
                }}
              />
            )}
            <Icon
              size={22}
              color={active ? "#2FA4D7" : "#FFFFFF"}
              strokeWidth={active ? 2.5 : 2.1}
              style={!active ? { opacity: 0.96 } : undefined}
            />
            <span
              style={{
                fontSize: 10,
                color: active ? "#2FA4D7" : "#FFFFFF",
                fontWeight: active ? 800 : 700,
                opacity: active ? 1 : 0.96,
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
