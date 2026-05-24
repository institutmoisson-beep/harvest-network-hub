
-- 1. Profiles: restrict SELECT
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;

CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins and staff can read all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'pack_manager'::app_role)
  OR public.has_role(auth.uid(), 'partner_manager'::app_role)
  OR public.has_role(auth.uid(), 'financier'::app_role)
);

-- 2. Safe profile lookup function (for cross-user name/code display)
CREATE OR REPLACE FUNCTION public.get_public_profiles(_ids uuid[])
RETURNS TABLE(id uuid, first_name text, last_name text, avatar_url text,
              referral_code text, career_level career_level, country text,
              is_system_active boolean)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, first_name, last_name, avatar_url, referral_code,
         career_level, country, is_system_active
  FROM public.profiles
  WHERE id = ANY(_ids);
$$;
REVOKE ALL ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.find_profile_by_code(_code text)
RETURNS TABLE(id uuid, first_name text, last_name text, referral_code text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, first_name, last_name, referral_code
  FROM public.profiles
  WHERE referral_code = upper(_code)
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.find_profile_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_profile_by_code(text) TO authenticated;

-- 3. Pros directory view (opted-in pros, publicly readable)
CREATE OR REPLACE VIEW public.pros_directory AS
SELECT id, first_name, last_name, avatar_url, referral_code,
       career_level, country, email, phone
FROM public.profiles
WHERE is_pro_visible = true AND account_status = 'active';

GRANT SELECT ON public.pros_directory TO authenticated, anon;

-- 4. Login lookup: email by referral code
CREATE OR REPLACE FUNCTION public.get_email_by_referral_code(_code text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE referral_code = upper(_code) LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_email_by_referral_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_by_referral_code(text) TO anon, authenticated;

-- 5. Wallet transactions: tighten transfer insert policy
DROP POLICY IF EXISTS "Allow transfer inserts for recipients" ON public.wallet_transactions;

CREATE POLICY "Users can insert own transfers"
ON public.wallet_transactions FOR INSERT TO authenticated
WITH CHECK (
  type = 'transfert'::transaction_type
  AND (user_id = auth.uid() OR recipient_id = auth.uid())
);

-- 6. Storage: restrict pack-images uploads/deletes to admin/pack_manager
DROP POLICY IF EXISTS "Auth upload pack images" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete pack images" ON storage.objects;

CREATE POLICY "Admins and pack managers upload pack images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'pack-images'
  AND (public.has_role(auth.uid(), 'admin'::app_role)
       OR public.has_role(auth.uid(), 'pack_manager'::app_role))
);

CREATE POLICY "Admins and pack managers delete pack images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'pack-images'
  AND (public.has_role(auth.uid(), 'admin'::app_role)
       OR public.has_role(auth.uid(), 'pack_manager'::app_role))
);

-- 7. Companies: only expose active companies publicly
DROP POLICY IF EXISTS "Anyone can read active companies" ON public.companies;

CREATE POLICY "Anyone can read active companies"
ON public.companies FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can read all companies"
ON public.companies FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
