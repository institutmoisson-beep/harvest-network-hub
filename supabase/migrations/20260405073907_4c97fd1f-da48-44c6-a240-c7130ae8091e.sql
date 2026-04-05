
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _referral_code TEXT;
  _sponsor_id UUID;
  _position TEXT;
  _left_count INT;
  _right_count INT;
BEGIN
  _referral_code := 'MSN' || lpad(floor(random() * 1000000)::text, 6, '0');
  
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = _referral_code) LOOP
    _referral_code := 'MSN' || lpad(floor(random() * 1000000)::text, 6, '0');
  END LOOP;

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
    -- Auto-balance: count left and right, place on the side with fewer members
    SELECT COUNT(*) INTO _left_count FROM public.network WHERE sponsor_id = _sponsor_id AND position = 'left';
    SELECT COUNT(*) INTO _right_count FROM public.network WHERE sponsor_id = _sponsor_id AND position = 'right';
    
    IF _left_count <= _right_count THEN
      _position := 'left';
    ELSE
      _position := 'right';
    END IF;

    INSERT INTO public.network (user_id, sponsor_id, level, position)
    VALUES (NEW.id, _sponsor_id, 1, _position);
  END IF;

  RETURN NEW;
END;
$function$;
