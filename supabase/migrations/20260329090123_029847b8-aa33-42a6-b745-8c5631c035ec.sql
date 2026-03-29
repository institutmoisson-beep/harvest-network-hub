
-- Update handle_new_user to generate MSN + 6 digit referral codes
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _referral_code TEXT;
  _sponsor_id UUID;
BEGIN
  _referral_code := 'MSN' || lpad(floor(random() * 1000000)::text, 6, '0');
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = _referral_code) LOOP
    _referral_code := 'MSN' || lpad(floor(random() * 1000000)::text, 6, '0');
  END LOOP;

  -- Find sponsor by referral code
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL AND NEW.raw_user_meta_data->>'referral_code' != '' THEN
    SELECT id INTO _sponsor_id FROM public.profiles WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, email, country, phone, referral_code, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    _referral_code,
    _sponsor_id
  );

  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  IF _sponsor_id IS NOT NULL THEN
    INSERT INTO public.network (user_id, sponsor_id, level)
    VALUES (NEW.id, _sponsor_id, 1);
  END IF;

  RETURN NEW;
END;
$function$;

-- Update existing admin referral code to MSN format
UPDATE public.profiles SET referral_code = 'MSN100000' WHERE email = 'picelvus@gmail.com' AND referral_code NOT LIKE 'MSN%';

-- Create trigger on auth.users if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_admin_signup ON auth.users;
CREATE TRIGGER on_admin_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_admin_on_signup();
