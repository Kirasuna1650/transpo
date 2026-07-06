-- User-side live location sharing.
-- RLS is intentionally omitted here because the project is currently testing with RLS disabled.
create table if not exists public.user_locations (
  user_id uuid primary key references auth.users on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  last_seen_at timestamp with time zone default timezone('utc'::text, now())
);

-- Driver/PUV tester live location sharing.
-- DriverMode.tsx currently upserts into this table by vehicles.id.
create table if not exists public.vehicles (
  id uuid primary key,
  route_id text,
  label text,
  latitude double precision,
  longitude double precision,
  metadata jsonb,
  last_seen_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.vehicles
add column if not exists metadata jsonb;
