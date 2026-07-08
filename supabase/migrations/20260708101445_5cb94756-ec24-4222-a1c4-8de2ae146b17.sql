
DROP POLICY IF EXISTS "Admins and staff can read all profiles" ON public.profiles;

CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.list_users_for_staff(_country text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, first_name text, last_name text, email text, phone text, country text, referral_code text, account_status account_status, is_system_active boolean, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.first_name, p.last_name, p.email, p.phone, p.country, p.referral_code, p.account_status, p.is_system_active, p.created_at
  FROM public.profiles p
  WHERE (public.has_role(auth.uid(),'admin'::app_role)
         OR public.has_role(auth.uid(),'hr_manager'::app_role)
         OR public.has_role(auth.uid(),'communication'::app_role)
         OR public.has_role(auth.uid(),'financier'::app_role)
         OR public.has_role(auth.uid(),'country_harvester'::app_role)
         OR public.has_role(auth.uid(),'city_harvester'::app_role)
         OR public.has_role(auth.uid(),'zone_harvester'::app_role))
    AND (_country IS NULL OR p.country = _country)
  ORDER BY p.created_at DESC
  LIMIT 1000;
$function$;

DROP POLICY IF EXISTS "Staff read relays" ON public.relay_points;

CREATE POLICY "Staff read relays"
ON public.relay_points
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'country_harvester'::app_role)
  OR public.has_role(auth.uid(), 'delivery_manager'::app_role)
);
