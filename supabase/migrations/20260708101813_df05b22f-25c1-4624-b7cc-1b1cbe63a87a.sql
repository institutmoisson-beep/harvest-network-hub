
-- 1. Add city column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;

-- 2. Update handle_new_user to store city from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

  INSERT INTO public.profiles (id, first_name, last_name, email, country, city, phone, referral_code, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    _referral_code,
    _sponsor_id
  );

  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  IF _sponsor_id IS NOT NULL THEN
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

-- 3. Update compute_custom_order_commission to always apply a default base rate (5%) if none configured
CREATE OR REPLACE FUNCTION public.compute_custom_order_commission(_order_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _o public.custom_orders%ROWTYPE;
  _pct numeric := 0;
  _rule_pct numeric;
BEGIN
  SELECT * INTO _o FROM public.custom_orders WHERE id = _order_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  SELECT percentage INTO _pct FROM public.mlm_commission_configs
    WHERE is_active AND criteria_type = 'base'
    ORDER BY updated_at DESC LIMIT 1;
  -- Fallback: 5% par défaut si aucune règle "base" active n'est configurée
  _pct := COALESCE(_pct, 5);

  SELECT percentage INTO _rule_pct FROM public.mlm_commission_configs
    WHERE is_active AND criteria_type = 'frequency' AND criteria_value = _o.delivery_frequency
    ORDER BY updated_at DESC LIMIT 1;
  IF _rule_pct IS NOT NULL THEN _pct := _rule_pct; END IF;

  RETURN ROUND(_o.total_amount * _pct / 100, 2);
END; $function$;

-- 4. Rewrite distribute_custom_order_commissions:
--    - Credite d'abord l'acheteur (cashback 10% du pool) dans son portefeuille + historique
--    - Puis distribue le reste à la lignée ascendante en unilevel infini (50% décroissant),
--      en démarrant à 30% pour le parrain direct (aligné sur la logique packs)
CREATE OR REPLACE FUNCTION public.distribute_custom_order_commissions(_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _o public.custom_orders%ROWTYPE;
  _pool numeric;
  _buyer_share numeric;
  _remaining_pool numeric;
  _sponsor uuid;
  _current uuid;
  _pct numeric := 30;   -- Commission niveau 1 (parrain direct) : 30 % du pool restant
  _min_pct numeric := 0.01;
  _level int := 0;
  _commission numeric;
BEGIN
  SELECT * INTO _o FROM public.custom_orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  IF _o.status <> 'delivered' THEN RETURN; END IF;

  -- Protection contre double distribution
  IF EXISTS(SELECT 1 FROM public.custom_order_commissions WHERE source_order_id = _order_id) THEN
    RETURN;
  END IF;

  _pool := public.compute_custom_order_commission(_order_id);
  IF _pool <= 0 THEN RETURN; END IF;

  UPDATE public.custom_orders SET calculated_commission = _pool WHERE id = _order_id;

  -- === 1) Cashback acheteur : 10 % du pool ===
  _buyer_share := ROUND(_pool * 0.10, 2);
  IF _buyer_share >= 1 AND _o.user_id IS NOT NULL THEN
    UPDATE public.wallets
       SET balance = balance + _buyer_share, updated_at = now()
     WHERE user_id = _o.user_id;
    INSERT INTO public.wallet_transactions(user_id, type, amount, status, notes)
    VALUES(_o.user_id, 'commission'::transaction_type, _buyer_share, 'approved'::transaction_status,
           'Cashback commande hors-catalogue: ' || _o.product_name);
    INSERT INTO public.custom_order_commissions(source_order_id, user_id, amount, level_depth, percentage_applied)
    VALUES(_order_id, _o.user_id, _buyer_share, 0, 10);
  END IF;

  -- === 2) Distribution MLM unilevel infini sur le pool restant ===
  _remaining_pool := _pool - COALESCE(_buyer_share, 0);
  IF _remaining_pool <= 0 THEN RETURN; END IF;

  _current := _o.user_id;
  LOOP
    _level := _level + 1;
    SELECT referred_by INTO _sponsor FROM public.profiles WHERE id = _current;
    EXIT WHEN _sponsor IS NULL;
    EXIT WHEN _pct < _min_pct;

    _commission := ROUND(_remaining_pool * _pct / 100, 2);
    IF _commission >= 1 THEN
      UPDATE public.wallets
         SET balance = balance + _commission, updated_at = now()
       WHERE user_id = _sponsor;
      INSERT INTO public.wallet_transactions(user_id, type, amount, status, notes)
      VALUES(_sponsor, 'commission'::transaction_type, _commission, 'approved'::transaction_status,
             'Commission niveau ' || _level || ' commande hors-catalogue: ' || _o.product_name);
      INSERT INTO public.custom_order_commissions(source_order_id, user_id, amount, level_depth, percentage_applied)
      VALUES(_order_id, _sponsor, _commission, _level, _pct);
    END IF;

    _current := _sponsor;
    _pct := _pct / 2;
  END LOOP;
END; $function$;
