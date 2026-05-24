
DROP VIEW IF EXISTS public.pros_directory;

-- Recreate as security_invoker so RLS of the caller applies
-- We expose this via a SECURITY DEFINER function instead to safely show opted-in pros only.
CREATE OR REPLACE FUNCTION public.list_pros_directory()
RETURNS TABLE(id uuid, first_name text, last_name text, avatar_url text,
              referral_code text, career_level career_level, country text,
              email text, phone text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, first_name, last_name, avatar_url, referral_code,
         career_level, country, email, phone
  FROM public.profiles
  WHERE is_pro_visible = true AND account_status = 'active';
$$;
REVOKE ALL ON FUNCTION public.list_pros_directory() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_pros_directory() TO anon, authenticated;
