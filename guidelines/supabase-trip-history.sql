create table if not exists public.trip_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  route_ids text[] not null default '{}',
  started_at timestamp with time zone not null default timezone('utc'::text, now()),
  ended_at timestamp with time zone,
  status text not null default 'active',
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists trip_history_user_id_idx
on public.trip_history (user_id, started_at desc);

create index if not exists trip_history_route_ids_idx
on public.trip_history using gin (route_ids);
