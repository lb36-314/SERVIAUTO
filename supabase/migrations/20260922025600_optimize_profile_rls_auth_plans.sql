-- Optimize profile RLS policies so auth.uid() is evaluated once per statement.
-- Applied to the SERVIAUTO Supabase project as migration optimize_profile_rls_auth_plans.

DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT
  WITH CHECK (
    (shop_id = public.current_shop_id())
    AND (id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS profiles_self ON public.profiles;
CREATE POLICY profiles_self ON public.profiles
  FOR SELECT
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE
  USING (
    (shop_id = public.current_shop_id())
    AND (
      (id = (SELECT auth.uid()))
      OR (public.current_role() = ANY (ARRAY['Owner'::text, 'Manager'::text]))
    )
  )
  WITH CHECK (
    (shop_id = public.current_shop_id())
    AND (
      (id = (SELECT auth.uid()))
      OR (public.current_role() = ANY (ARRAY['Owner'::text, 'Manager'::text]))
    )
  );
