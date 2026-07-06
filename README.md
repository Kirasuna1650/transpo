# TRANSPO

React + Vite prototype for live Metro Manila route selection, vehicle telemetry, GPS sharing, trip history, saved routes, and simulated crowd hotspots.

## Requirements

- Node.js 18+
- npm
- Supabase project with the tables in `guidelines/*.sql`

## Setup

```bash
npm install --legacy-peer-deps
```

Create `.env.local` in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For the local simulator, the anon key is enough while RLS is disabled for the simulator tables. For safer backend-style writes, add a service role key locally only:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Do not commit `.env.local` or expose the service role key in frontend code.

## Supabase Tables

Run these SQL files in Supabase as needed:

```bash
guidelines/supabase-location-tables.sql
guidelines/supabase-route-selection-events.sql
guidelines/supabase-trip-history.sql
guidelines/supabase-live-stops.sql
guidelines/supabase-vehicles-rls.sql
```

For local UAT, you can keep RLS disabled on simulator tables. Before public usage, enable RLS and prefer server-side/service-role simulator writes.

## Run The App

```bash
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```bash
http://localhost:5173
```

If another local project is already using that port, Vite will choose another one.

## Run The Traffic Simulator

Open a second terminal:

```bash
npm run simulate:traffic
```

The simulator reads `src/data/Final.geojson`, then writes:

- moving vehicles into `public.vehicles`
- live stop crowd hotspots into `public.live_stops`

Leave this terminal running while testing the map.

## Build

```bash
npm run build
```

## Route Data

The active route source is:

```bash
src/data/Final.geojson
```

The curated golden route IDs are mapped in:

```bash
src/app/data/routes.ts
```

## Optional Route Snapping

If you need to regenerate OSRM-snapped route output:

```bash
npm run snap:routes
```
