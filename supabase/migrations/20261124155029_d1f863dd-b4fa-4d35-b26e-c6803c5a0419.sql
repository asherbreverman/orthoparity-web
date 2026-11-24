DROP POLICY IF EXISTS "public read" ON public.pc_team_participant;
CREATE POLICY "public read" ON public.pc_team_participant FOR SELECT TO anon, authenticated USING (ccn IS NOT NULL);
DROP POLICY IF EXISTS "public read" ON public.pc_team_family;
CREATE POLICY "public read" ON public.pc_team_family FOR SELECT TO anon, authenticated USING (family_id IS NOT NULL);
DROP POLICY IF EXISTS "public read" ON public.pc_team_trigger;
CREATE POLICY "public read" ON public.pc_team_trigger FOR SELECT TO anon, authenticated USING (category_id IS NOT NULL AND code IS NOT NULL);
DROP POLICY IF EXISTS "public read" ON public.pc_team_target_price;
CREATE POLICY "public read" ON public.pc_team_target_price FOR SELECT TO anon, authenticated USING (drg IS NOT NULL AND region IS NOT NULL);