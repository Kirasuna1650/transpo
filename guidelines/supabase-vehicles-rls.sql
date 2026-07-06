-- Recommended for the Node simulator:
-- Put SUPABASE_SERVICE_ROLE_KEY in .env.local and keep this key server-only.
-- Service role bypasses RLS, so you do not need broad public write policies.

alter table public.vehicles enable row level security;

-- Let the frontend read vehicle telemetry.
drop policy if exists "vehicles are readable by clients" on public.vehicles;
create policy "vehicles are readable by clients"
on public.vehicles
for select
to anon, authenticated
using (true);

-- UAT-only fallback if you must run simulateTraffic.js with the anon key.
-- Prefer SUPABASE_SERVICE_ROLE_KEY instead of enabling this.
drop policy if exists "uat simulated vehicles can be inserted by anon" on public.vehicles;
create policy "uat simulated vehicles can be inserted by anon"
on public.vehicles
for insert
to anon
with check ((metadata->>'simulated')::boolean is true);

drop policy if exists "uat simulated vehicles can be updated by anon" on public.vehicles;
create policy "uat simulated vehicles can be updated by anon"
on public.vehicles
for update
to anon
using ((metadata->>'simulated')::boolean is true)
with check ((metadata->>'simulated')::boolean is true);
