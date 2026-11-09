-- Priority 3: RLS on the leads (bookings) table.
-- Patients (anon key) can INSERT but never read other patients' data.
-- Authenticated staff can read and update all rows.

alter table leads enable row level security;

create policy "anon_insert_leads" on leads
  for insert to anon with check (true);

create policy "staff_select_leads" on leads
  for select to authenticated using (true);

create policy "staff_update_leads" on leads
  for update to authenticated using (true);

create policy "staff_delete_leads" on leads
  for delete to authenticated using (true);
