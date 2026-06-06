
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS id_moissonneur text UNIQUE,
  ADD COLUMN IF NOT EXISTS verification_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS signature_url text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_verification_token_idx ON public.profiles(verification_token);

WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at) AS rn, created_at FROM public.profiles WHERE id_moissonneur IS NULL
)
UPDATE public.profiles p
SET id_moissonneur = 'MS-' || to_char(COALESCE(n.created_at, now()),'YYYY') || '-' || lpad(n.rn::text, 6, '0')
FROM numbered n WHERE p.id = n.id;

CREATE OR REPLACE FUNCTION public.set_id_moissonneur()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _n int;
BEGIN
  IF NEW.id_moissonneur IS NULL THEN
    SELECT COUNT(*)+1 INTO _n FROM public.profiles WHERE date_part('year', created_at) = date_part('year', now());
    NEW.id_moissonneur := 'MS-' || to_char(now(),'YYYY') || '-' || lpad(_n::text, 6, '0');
  END IF;
  IF NEW.verification_token IS NULL THEN
    NEW.verification_token := gen_random_uuid();
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_set_id_moissonneur ON public.profiles;
CREATE TRIGGER trg_set_id_moissonneur BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_id_moissonneur();

CREATE OR REPLACE FUNCTION public.verify_member_token(_token uuid)
RETURNS TABLE(
  id_moissonneur text, first_name text, last_name text, avatar_url text, country text,
  is_system_active boolean, account_status account_status, career_level career_level, member_since timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id_moissonneur, first_name, last_name, avatar_url, country,
         is_system_active, account_status, career_level, created_at
  FROM public.profiles WHERE verification_token = _token LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.verify_member_token(uuid) TO anon, authenticated;

ALTER TABLE public.career_grades
  ADD COLUMN IF NOT EXISTS weekly_revenue_percentage numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_weekly_revenue numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rewards_description text DEFAULT '';

CREATE OR REPLACE FUNCTION public.admin_upsert_grade_v2(
  _id uuid, _name text, _description text,
  _min_revenue numeric, _min_active_referrals int, _min_downline_size int,
  _weekly_bonus numeric, _monthly_bonus numeric,
  _weekly_revenue_percentage numeric, _min_weekly_revenue numeric,
  _rewards_description text, _display_order int, _is_active boolean
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _gid uuid;
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role)) THEN
    RAISE EXCEPTION 'Action réservée';
  END IF;
  IF _id IS NULL THEN
    INSERT INTO public.career_grades(name, description, min_revenue, min_active_referrals, min_downline_size,
      weekly_bonus, monthly_bonus, weekly_revenue_percentage, min_weekly_revenue, rewards_description,
      display_order, is_active)
    VALUES(_name, COALESCE(_description,''), COALESCE(_min_revenue,0), COALESCE(_min_active_referrals,0),
      COALESCE(_min_downline_size,0), COALESCE(_weekly_bonus,0), COALESCE(_monthly_bonus,0),
      COALESCE(_weekly_revenue_percentage,0), COALESCE(_min_weekly_revenue,0), COALESCE(_rewards_description,''),
      COALESCE(_display_order,0), COALESCE(_is_active,true))
    RETURNING id INTO _gid;
  ELSE
    UPDATE public.career_grades SET name=_name, description=COALESCE(_description,''),
      min_revenue=COALESCE(_min_revenue,0), min_active_referrals=COALESCE(_min_active_referrals,0),
      min_downline_size=COALESCE(_min_downline_size,0),
      weekly_bonus=COALESCE(_weekly_bonus,0), monthly_bonus=COALESCE(_monthly_bonus,0),
      weekly_revenue_percentage=COALESCE(_weekly_revenue_percentage,0),
      min_weekly_revenue=COALESCE(_min_weekly_revenue,0),
      rewards_description=COALESCE(_rewards_description,''),
      display_order=COALESCE(_display_order,0), is_active=COALESCE(_is_active,true), updated_at=now()
    WHERE id=_id RETURNING id INTO _gid;
  END IF;
  RETURN _gid;
END; $$;

CREATE OR REPLACE FUNCTION public.pay_weekly_revenue_bonuses()
RETURNS TABLE(users_paid int, total_paid numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _u RECORD; _grade public.career_grades%ROWTYPE;
  _weekly_revenue numeric; _bonus numeric;
  _week_start timestamptz := date_trunc('week', now());
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role)) THEN
    RAISE EXCEPTION 'Action réservée';
  END IF;
  users_paid := 0; total_paid := 0;
  FOR _u IN SELECT o.user_id, o.grade_id FROM public.user_career_overrides o WHERE o.grade_id IS NOT NULL
  LOOP
    SELECT * INTO _grade FROM public.career_grades WHERE id = _u.grade_id;
    CONTINUE WHEN _grade.id IS NULL OR _grade.weekly_revenue_percentage <= 0;
    SELECT COALESCE(SUM(total_price),0) INTO _weekly_revenue FROM (
      SELECT total_price, created_at FROM public.orders WHERE user_id = _u.user_id AND created_at >= _week_start
      UNION ALL
      SELECT total_price, created_at FROM public.commerce_orders WHERE user_id = _u.user_id AND created_at >= _week_start
    ) t;
    CONTINUE WHEN _weekly_revenue < _grade.min_weekly_revenue;
    _bonus := (_weekly_revenue * _grade.weekly_revenue_percentage) / 100;
    CONTINUE WHEN _bonus < 1;
    IF EXISTS(SELECT 1 FROM public.career_bonus_payouts WHERE user_id = _u.user_id AND period = 'weekly-' || to_char(_week_start,'IYYY-IW')) THEN CONTINUE; END IF;
    UPDATE public.wallets SET balance = balance + _bonus, updated_at = now() WHERE user_id = _u.user_id;
    INSERT INTO public.wallet_transactions(user_id, type, amount, status, notes)
    VALUES(_u.user_id, 'commission'::transaction_type, _bonus, 'approved'::transaction_status,
           'Bonus hebdo (' || _grade.weekly_revenue_percentage || '% de ' || _weekly_revenue || ' FCFA)');
    INSERT INTO public.career_bonus_payouts(user_id, grade_id, amount, period, notes, paid_by)
    VALUES(_u.user_id, _grade.id, _bonus, 'weekly-' || to_char(_week_start,'IYYY-IW'),
           'Auto: ' || _grade.weekly_revenue_percentage || '% du CA hebdo', auth.uid());
    users_paid := users_paid + 1;
    total_paid := total_paid + _bonus;
  END LOOP;
  RETURN NEXT;
END; $$;
