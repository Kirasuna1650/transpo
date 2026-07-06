-- Golden Route selection history for UAT route defaults.
-- RLS is intentionally omitted here because the project is currently testing with RLS disabled.
create table if not exists public.route_selection_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  route_id text not null,
  selected_at timestamp with time zone default timezone('utc'::text, now())
);

create index if not exists route_selection_events_route_id_idx
  on public.route_selection_events (route_id);

create index if not exists route_selection_events_selected_at_idx
  on public.route_selection_events (selected_at desc);
