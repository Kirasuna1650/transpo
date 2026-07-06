import { Bell, Clock, CheckCircle, AlertCircle, Info, Trash2 } from "lucide-react";
import { useState } from "react";

interface Notification {
  id: string;
  type: "arriving" | "seat" | "route" | "system";
  title: string;
  body: string;
  time: string;
  read: boolean;
  emoji: string;
}

const INITIAL_NOTIFS: Notification[] = [
  {
    id: "n1",
    type: "arriving",
    title: "Vehicle Arriving Soon",
    body: "EDSA Carousel Bus is 2 stops away at Ortigas. Expected in 4 minutes.",
    time: "2 min ago",
    read: false,
    emoji: "🚌",
  },
  {
    id: "n2",
    type: "seat",
    title: "Seat Now Available",
    body: "MRT-3 train heading to Taft Ave now has available seats. Capacity: 65%.",
    time: "8 min ago",
    read: false,
    emoji: "🚃",
  },
  {
    id: "n3",
    type: "route",
    title: "Saved Route Update",
    body: "Home → School route via Cubao Jeepney is operational. Less crowd today.",
    time: "22 min ago",
    read: true,
    emoji: "🏠",
  },
  {
    id: "n4",
    type: "arriving",
    title: "UV Express Nearby",
    body: "Makati–BGC UV Express is 0.5 km from your location. ETA: 3 minutes.",
    time: "35 min ago",
    read: true,
    emoji: "🚐",
  },
  {
    id: "n5",
    type: "system",
    title: "Low-Data Mode Active",
    body: "Transpo switched to low-data mode for your current network.",
    time: "1 hr ago",
    read: true,
    emoji: "📶",
  },
  {
    id: "n6",
    type: "route",
    title: "Route Disruption",
    body: "LRT-2 service from Santolan delayed by 15 min due to passenger volume.",
    time: "2 hrs ago",
    read: true,
    emoji: "⚠️",
  },
];

const TYPE_COLOR: Record<string, string> = {
  arriving: "#2FA4D7",
  seat: "#27AE60",
  route: "#2E86C1",
  system: "#8899A8",
};

export function NotificationsScreen() {
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS);

  const markAllRead = () => setNotifs((n) => n.map((x) => ({ ...x, read: true })));
  const dismiss = (id: string) => setNotifs((n) => n.filter((x) => x.id !== id));

  const unread = notifs.filter((n) => !n.read).length;
  const today = notifs.filter((_, i) => i < 4);
  const earlier = notifs.filter((_, i) => i >= 4);

  const renderNotif = (n: Notification) => (
    <div
      key={n.id}
      className="flex items-start gap-3 p-3.5 rounded-2xl relative"
      style={{
        background: n.read ? "#0E1E2A" : "#0E1E2A",
        border: `1px solid ${n.read ? "#1C3344" : TYPE_COLOR[n.type] + "44"}`,
      }}
    >
      {!n.read && (
        <div
          className="absolute top-3 right-3 w-2 h-2 rounded-full"
          style={{ background: TYPE_COLOR[n.type] }}
        />
      )}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: TYPE_COLOR[n.type] + "22", fontSize: 20 }}
      >
        {n.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p style={{ color: "#EAECF0", fontSize: 13, fontWeight: 700 }}>{n.title}</p>
          <button onClick={() => dismiss(n.id)}>
            <Trash2 size={13} color="#2A4050" />
          </button>
        </div>
        <p style={{ color: "#4A6070", fontSize: 12, lineHeight: 1.5, marginTop: 2 }}>{n.body}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <Clock size={10} color="#3A5060" />
          <span style={{ color: "#3A5060", fontSize: 10 }}>{n.time}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: "#000" }}>
      {/* Header */}
      <div className="shrink-0 pt-10 px-4 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 style={{ color: "#EAECF0", fontSize: 22, fontWeight: 800 }}>Notifications</h1>
          {unread > 0 && (
            <span
              className="px-2.5 py-0.5 rounded-full"
              style={{ background: "#2FA4D7", color: "#000", fontSize: 12, fontWeight: 800 }}
            >
              {unread}
            </span>
          )}
        </div>
        {unread > 0 ? (
          <button onClick={markAllRead} style={{ color: "#2FA4D7", fontSize: 12, fontWeight: 600 }}>
            Mark all as read
          </button>
        ) : (
          <p style={{ color: "#3A5060", fontSize: 12 }}>All caught up!</p>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "#0E1E2A", border: "1px solid #1C3344" }}
          >
            <Bell size={28} color="#2A4050" />
          </div>
          <p style={{ color: "#3A5060", fontSize: 14 }}>No notifications</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-3 pb-4">
          {/* Today */}
          <p style={{ color: "#3A5060", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Today
          </p>
          {today.map(renderNotif)}

          {/* Earlier */}
          {earlier.length > 0 && (
            <>
              <p style={{ color: "#3A5060", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 4 }}>
                Earlier
              </p>
              {earlier.map(renderNotif)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
