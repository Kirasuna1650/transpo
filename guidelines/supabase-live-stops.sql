create table if not exists public.live_stops (
  id text primary key,
  route_id text,
  label text,
  mode text,
  crowd_level text not null default 'low',
  waiting_commuters integer not null default 0,
  last_updated timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists live_stops_route_id_idx
on public.live_stops (route_id);

alter table public.live_stops
add column if not exists route_id text,
add column if not exists mode text;
