# Figma AI Prompt: PUV-Commuter Geolocator

Copy everything below into Figma AI / Figma Make.

---

## Prompt

Design a **mobile app (iOS/Android)** called **PUV-Commuter Geolocator** — a real-time public transport tracking app for Metro Manila commuters. Style: **dark mode, tech-forward, data-dashboard feel** (think a fusion of Grab's live map and a transit control panel).

**Color palette (use exactly):**
- `#000000` — True Black → base background
- `#233D4D` — Deep Slate Blue → cards, nav bar, surfaces
- `#FE7F2D` — Orange → primary accent, CTAs, active states, live markers
- `#EAECF0` — Light Gray → primary text, icons on dark surfaces

Use rounded corners (12–16px), soft glow/shadow on the orange accent for "live" elements, and a clean sans-serif (e.g., Inter/SF Pro).

**Core function:** Users track real-time jeepney, bus, train, and UV Express locations, see ETA, check available seating space, and view crowd density at waiting areas — routed and mapped using the **OpenStreetMap (OSM) API**.

---

## Full App Structure (screen-by-screen)

**1. Onboarding**
- Splash screen (logo, dark bg, orange accent glow)
- Welcome carousel (3 slides: track vehicles → see ETA & space → avoid crowds)
- Location permission request
- Notification permission request

**2. Auth**
- Login / Sign Up
- Guest mode option (skip to Home)

**3. Home / Live Map (main screen)**
- Full-screen OSM map, dark map style
- Top search bar: "Where to?"
- Filter chips: Jeepney / Bus / Train / UV Express (Tricycle & Taxi as secondary/optional toggle)
- Live vehicle markers (orange pulse animation) moving along OSM routes
- Bottom mini-card: nearest vehicle preview (ETA + capacity dot)

**4. Route Planner**
- Origin/destination input (autocomplete via OSM geocoding)
- Transport mode selector
- Results list: route options with ETA, transfer count, estimated fare
- Sample seed routes for demo data (use as origin/destination pairs):
  - EDSA Carousel ↔ Cubao
  - Cubao ↔ Makati
  - Makati ↔ Taft Avenue
  - Taft Avenue ↔ Buendia
  - Buendia ↔ Divisoria
  - Divisoria ↔ Monument
  - Monument ↔ EDSA Carousel

**5. Live Tracking Screen**
- Selected vehicle detail: live position on route line, ETA countdown
- Capacity indicator (Available / Limited / Full — color-coded dot: green/orange/red)
- "Notify me when near" toggle
- Route progress bar (stops passed vs. upcoming)

**6. Crowd Heatmap Overlay**
- Toggle on map: shows waiting-area density (color gradient over stops)
- Tap a stop → shows crowd level + last updated time

**7. Notifications Center**
- List of alerts: vehicle arriving, seat availability update, saved route status

**8. Saved Routes**
- List of favorited trips (e.g., "Home → School")
- Quick-access card with live ETA shown directly on the list
- Add/edit/delete saved route

**9. Profile**
- Name, role (Commuter/Student/Driver/Worker), preferred transport modes
- Trip history (optional)

**10. Settings**
- Notification preferences
- Offline/low-data mode toggle
- Map style (dark/light)
- About / Help / Feedback

---

## Design Priorities (from user research, 31 respondents)
- Focus real-time tracking, ETA, and space-availability features on **Jeepney, Bus, Train, UV Express** — these scored highest as "very needed."
- Treat **Tricycle** and **Franchise Taxi** as low-priority/optional filters — respondents rated these lowest.
- Keep UI fast and simple — feedback flagged concerns about slow load times, ad clutter, and complexity for elderly users.
- Include a lightweight/offline-friendly state for low-connectivity areas — a recurring user suggestion.
