
-- Commission rates table for configurable % per level
CREATE TABLE IF NOT EXISTS public.commission_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level integer NOT NULL UNIQUE,
  percentage numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commission rates" ON public.commission_rates
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read commission rates" ON public.commission_rates
FOR SELECT TO authenticated USING (true);

-- Insert default rates for 10 levels
INSERT INTO public.commission_rates (level, percentage) VALUES
(1, 10), (2, 5), (3, 3), (4, 2), (5, 1),
(6, 1), (7, 0.5), (8, 0.5), (9, 0.25), (10, 0.25)
ON CONFLICT (level) DO NOTHING;

-- Add whatsapp, facebook, contact_whatsapp fields to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS contact_whatsapp text DEFAULT '';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS contact_facebook text DEFAULT '';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS contact_email text DEFAULT '';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS image_url_2 text DEFAULT '';

-- Add order_rating table
CREATE TABLE IF NOT EXISTS public.order_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  product_rating integer NOT NULL DEFAULT 5 CHECK (product_rating >= 1 AND product_rating <= 5),
  delivery_rating integer NOT NULL DEFAULT 5 CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

ALTER TABLE public.order_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own ratings" ON public.order_ratings
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own ratings" ON public.order_ratings
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can read all ratings" ON public.order_ratings
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Re-create triggers that are missing
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
    INSERT INTO public.network (user_id, sponsor_id, level)
    VALUES (NEW.id, _sponsor_id, 1);
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure admin trigger exists
DROP TRIGGER IF EXISTS on_admin_signup ON auth.users;
CREATE TRIGGER on_admin_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_on_signup();
