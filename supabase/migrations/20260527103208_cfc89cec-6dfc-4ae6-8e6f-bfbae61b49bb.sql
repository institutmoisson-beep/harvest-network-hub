
CREATE TABLE IF NOT EXISTS public.relay_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'boutique',
  country text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  phone text,
  responsible_name text,
  manager_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.relay_points TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relay_points TO authenticated;
GRANT ALL ON public.relay_points TO service_role;
ALTER TABLE public.relay_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active relays" ON public.relay_points
  FOR SELECT USING (is_active = true OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'country_harvester'::app_role) OR has_role(auth.uid(),'delivery_manager'::app_role));
CREATE POLICY "Admins manage relays" ON public.relay_points
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'country_harvester'::app_role) OR has_role(auth.uid(),'delivery_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'country_harvester'::app_role) OR has_role(auth.uid(),'delivery_manager'::app_role));
CREATE INDEX IF NOT EXISTS idx_relay_country_city ON public.relay_points(country, city, is_active);

CREATE TABLE IF NOT EXISTS public.role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  country text,
  city text,
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_assignments TO authenticated;
GRANT ALL ON public.role_assignments TO service_role;
ALTER TABLE public.role_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage role assignments" ON public.role_assignments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Users read own role assignments" ON public.role_assignments
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_role_assignments_user ON public.role_assignments(user_id);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS relay_point_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_status delivery_status NOT NULL DEFAULT 'en_preparation';
ALTER TABLE public.commerce_orders ADD COLUMN IF NOT EXISTS relay_point_id uuid;
ALTER TABLE public.commerce_orders ADD COLUMN IF NOT EXISTS delivery_status delivery_status NOT NULL DEFAULT 'en_preparation';
CREATE INDEX IF NOT EXISTS idx_orders_relay ON public.orders(relay_point_id);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_relay ON public.commerce_orders(relay_point_id);

CREATE OR REPLACE FUNCTION public.has_geo_scope(_uid uuid, _country text, _city text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.role_assignments ra
    WHERE ra.user_id = _uid
      AND (ra.country IS NULL OR ra.country = _country)
      AND (ra.city IS NULL OR ra.city = _city)
  ) OR public.has_role(_uid,'admin'::app_role);
$$;

CREATE OR REPLACE FUNCTION public.assign_role(_user_id uuid, _role app_role, _country text DEFAULT NULL, _city text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin'::app_role) THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role) ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.role_assignments(user_id, role, country, city, assigned_by)
  VALUES (_user_id, _role, NULLIF(_country,''), NULLIF(_city,''), auth.uid());
END; $$;

CREATE OR REPLACE FUNCTION public.revoke_role(_user_id uuid, _role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin'::app_role) THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role;
  DELETE FROM public.role_assignments WHERE user_id = _user_id AND role = _role;
END; $$;

CREATE OR REPLACE FUNCTION public.update_delivery_status(_order_id uuid, _kind text, _status delivery_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  IF NOT (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'delivery_manager'::app_role)) THEN
    RAISE EXCEPTION 'Réservé livraison';
  END IF;
  IF _kind = 'pack' THEN
    UPDATE public.orders SET delivery_status = _status, updated_at = now() WHERE id = _order_id;
  ELSIF _kind = 'commerce' THEN
    UPDATE public.commerce_orders SET delivery_status = _status, updated_at = now() WHERE id = _order_id;
  ELSE
    RAISE EXCEPTION 'Type inconnu';
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.set_account_status(_user_id uuid, _status account_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _country text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  SELECT country INTO _country FROM public.profiles WHERE id = _user_id;
  IF NOT (public.has_role(auth.uid(),'admin'::app_role)
          OR public.has_role(auth.uid(),'hr_manager'::app_role)
          OR (public.has_role(auth.uid(),'country_harvester'::app_role) AND public.has_geo_scope(auth.uid(), _country, ''))) THEN
    RAISE EXCEPTION 'Action non autorisée';
  END IF;
  UPDATE public.profiles SET account_status = _status, updated_at = now() WHERE id = _user_id;
END; $$;

CREATE OR REPLACE FUNCTION public.list_relay_points(_country text DEFAULT NULL, _city text DEFAULT NULL)
RETURNS SETOF public.relay_points LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.relay_points
  WHERE is_active = true
    AND (_country IS NULL OR country = _country)
    AND (_city IS NULL OR city = _city)
  ORDER BY country, city, name;
$$;

CREATE OR REPLACE FUNCTION public.list_users_for_staff(_country text DEFAULT NULL)
RETURNS TABLE(id uuid, first_name text, last_name text, email text, phone text, country text, referral_code text, account_status account_status, is_system_active boolean, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.first_name, p.last_name, p.email, p.phone, p.country, p.referral_code, p.account_status, p.is_system_active, p.created_at
  FROM public.profiles p
  WHERE (public.has_role(auth.uid(),'admin'::app_role)
         OR public.has_role(auth.uid(),'hr_manager'::app_role)
         OR public.has_role(auth.uid(),'country_harvester'::app_role)
         OR public.has_role(auth.uid(),'city_harvester'::app_role)
         OR public.has_role(auth.uid(),'zone_harvester'::app_role))
    AND (_country IS NULL OR p.country = _country)
  ORDER BY p.created_at DESC
  LIMIT 500;
$$;

CREATE OR REPLACE FUNCTION public.list_role_assignments()
RETURNS TABLE(id uuid, user_id uuid, first_name text, last_name text, referral_code text, role app_role, country text, city text, assigned_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ra.id, ra.user_id, p.first_name, p.last_name, p.referral_code, ra.role, ra.country, ra.city, ra.assigned_at
  FROM public.role_assignments ra
  LEFT JOIN public.profiles p ON p.id = ra.user_id
  WHERE public.has_role(auth.uid(),'admin'::app_role)
  ORDER BY ra.assigned_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_role(uuid, app_role, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.revoke_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_delivery_status(uuid, text, delivery_status) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_account_status(uuid, account_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_role(uuid, app_role, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_delivery_status(uuid, text, delivery_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_account_status(uuid, account_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_relay_points(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_users_for_staff(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_role_assignments() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_geo_scope(uuid, text, text) TO authenticated;
