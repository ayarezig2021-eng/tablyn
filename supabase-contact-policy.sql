-- Run once in Supabase SQL Editor to allow visitors to send contact messages.
-- Anonymous users can INSERT only; they cannot read, update, or delete messages.
grant insert on table public.contact_messages to anon;
drop policy if exists "Public can submit contact messages" on public.contact_messages;
create policy "Public can submit contact messages"
on public.contact_messages for insert to anon
with check (user_id is null);
