
-- 1) wallet_transactions: remove overly permissive transfer INSERT policy.
-- The transfer_to_user() SECURITY DEFINER function handles all transfer inserts.
DROP POLICY IF EXISTS "Users can insert own transfers" ON public.wallet_transactions;

-- 2) commerce_orders: restrict SELECT to buyer + staff (remove proposer_id read access to protect client PII).
DROP POLICY IF EXISTS "Users can read own commerce orders" ON public.commerce_orders;
CREATE POLICY "Buyers can read own commerce orders"
  ON public.commerce_orders FOR SELECT
  USING (user_id = auth.uid());

-- Keep UPDATE for buyer only (proposer shouldn't edit)
DROP POLICY IF EXISTS "Users can update own commerce orders" ON public.commerce_orders;
CREATE POLICY "Buyers can update own commerce orders"
  ON public.commerce_orders FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3) relay_points: restrict direct SELECT to admin/delivery/country_harvester only.
DROP POLICY IF EXISTS "Authenticated read active relays" ON public.relay_points;
CREATE POLICY "Staff read relays"
  ON public.relay_points FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'country_harvester'::app_role)
    OR has_role(auth.uid(), 'delivery_manager'::app_role)
  );

-- Replace list_relay_points RPC to return only safe (non-PII) columns for general users.
DROP FUNCTION IF EXISTS public.list_relay_points(text, text);
CREATE OR REPLACE FUNCTION public.list_relay_points(_country text DEFAULT NULL, _city text DEFAULT NULL)
RETURNS TABLE(id uuid, name text, type text, country text, city text, address text, is_active boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, name, type, country, city, address, is_active
  FROM public.relay_points
  WHERE is_active = true
    AND (_country IS NULL OR country = _country)
    AND (_city IS NULL OR city = _city)
  ORDER BY country, city, name;
$$;

GRANT EXECUTE ON FUNCTION public.list_relay_points(text, text) TO authenticated, anon;
