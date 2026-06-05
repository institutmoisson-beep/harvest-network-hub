DROP FUNCTION IF EXISTS public.accept_cgu();

CREATE FUNCTION public.accept_cgu()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_count integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  UPDATE public.profiles
  SET cgu_accepted = true,
      cgu_accepted_at = now(),
      updated_at = now()
  WHERE id = auth.uid();

  GET DIAGNOSTICS affected_count = ROW_COUNT;

  IF affected_count = 0 THEN
    RAISE EXCEPTION 'Profil introuvable pour cet utilisateur';
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_cgu() TO authenticated;