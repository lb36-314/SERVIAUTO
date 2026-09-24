-- SERVIAUTO performance and RLS maintenance
-- Adds covering indexes for foreign keys flagged by Supabase Performance Advisor
-- and removes duplicate permissive RLS policy evaluation.

DO $$
DECLARE
  r record;
  cols text;
BEGIN
  FOR r IN
    SELECT c.oid, c.conname, c.conrelid, n.nspname, rel.relname
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
      AND c.conname NOT IN (
        -- These FKs are intentionally outside the Performance Advisor finding set.
        'audit_logs_shop_id_fkey',
        'customers_shop_id_fkey',
        'diagnostic_codes_shop_id_fkey',
        'inspection_template_items_template_id_fkey',
        'inspection_templates_shop_id_fkey',
        'inventory_shop_id_fkey',
        'parts_requests_shop_id_fkey',
        'purchase_orders_shop_id_fkey',
        'repair_orders_shop_id_fkey',
        'vehicle_history_reports_vehicle_id_fkey',
        'vehicles_shop_id_fkey'
      )
  LOOP
    SELECT string_agg(format('%I', a.attname), ', ' ORDER BY u.ord)
      INTO cols
    FROM pg_constraint c2
    JOIN LATERAL unnest(c2.conkey) WITH ORDINALITY u(attnum, ord) ON true
    JOIN pg_attribute a
      ON a.attrelid = c2.conrelid
     AND a.attnum = u.attnum
    WHERE c2.oid = r.oid;

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I.%I (%s)',
      replace(r.conname, '_fkey', '_idx'),
      r.nspname,
      r.relname,
      cols
    );
  END LOOP;
END $$;

-- The application requires authenticated shop members. These policies had
-- identical predicates for public/authenticated and therefore caused duplicate
-- policy evaluation for authenticated requests.
DROP POLICY IF EXISTS shop_isolation_audit_logs ON public.audit_logs;
ALTER POLICY audit_logs_tenant ON public.audit_logs TO authenticated;

DROP POLICY IF EXISTS shop_isolation_customers ON public.customers;
ALTER POLICY customers_tenant ON public.customers TO authenticated;

DROP POLICY IF EXISTS shop_isolation_diagnostic_codes ON public.diagnostic_codes;
ALTER POLICY diagnostic_codes_tenant ON public.diagnostic_codes TO authenticated;

DROP POLICY IF EXISTS shop_isolation_diagnostic_scans ON public.diagnostic_scans;
ALTER POLICY diagnostic_scans_tenant ON public.diagnostic_scans TO authenticated;

DROP POLICY IF EXISTS shop_isolation_estimates ON public.estimates;
ALTER POLICY estimates_tenant ON public.estimates TO authenticated;

DROP POLICY IF EXISTS shop_isolation_inspections ON public.inspections;
ALTER POLICY inspections_tenant ON public.inspections TO authenticated;

DROP POLICY IF EXISTS shop_isolation_inventory ON public.inventory;
ALTER POLICY inventory_tenant ON public.inventory TO authenticated;

DROP POLICY IF EXISTS shop_isolation_invoices ON public.invoices;
ALTER POLICY invoices_tenant ON public.invoices TO authenticated;

DROP POLICY IF EXISTS shop_isolation_parts ON public.parts;
ALTER POLICY parts_tenant ON public.parts TO authenticated;

DROP POLICY IF EXISTS shop_isolation_payments ON public.payments;
ALTER POLICY payments_tenant ON public.payments TO authenticated;

DROP POLICY IF EXISTS shop_isolation_repair_orders ON public.repair_orders;
ALTER POLICY repair_orders_tenant ON public.repair_orders TO authenticated;

DROP POLICY IF EXISTS shop_isolation_vehicles ON public.vehicles;
ALTER POLICY vehicles_tenant ON public.vehicles TO authenticated;

-- Identical shop SELECT policies: retain the authenticated policy.
DROP POLICY IF EXISTS shops_member ON public.shops;

-- ALL already includes SELECT, so the SELECT-only policies were redundant.
DROP POLICY IF EXISTS "shop members read inspection templates" ON public.inspection_templates;
DROP POLICY IF EXISTS "shop members read inspection template items" ON public.inspection_template_items;

-- Preserve the union of the two prior profile SELECT policies.
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_self ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (shop_id = current_shop_id())
    OR (id = (SELECT auth.uid()))
  );
