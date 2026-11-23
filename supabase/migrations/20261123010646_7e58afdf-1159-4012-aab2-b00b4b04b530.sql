drop policy if exists "public read" on public.pc_approvals;
create policy "public read" on public.pc_approvals for select to anon, authenticated using (number is not null);
drop policy if exists "public read" on public.pc_approval_supplements;
create policy "public read" on public.pc_approval_supplements for select to anon, authenticated using (number is not null and supplement_number is not null);