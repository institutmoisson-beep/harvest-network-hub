
-- =========================================================
-- 1) TABLES
-- =========================================================

-- Configuration des taux de commission (admin)
CREATE TABLE public.mlm_commission_configs (
  id uuid primary key default gen_random_uuid(),
  rule_name text not null,
  criteria_type text not null default 'base' check (criteria_type in ('base','frequency','zone','amount')),
  criteria_value text,
  percentage numeric(6,3) not null default 0 check (percentage >= 0 and percentage <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT ON public.mlm_commission_configs TO authenticated;
GRANT ALL ON public.mlm_commission_configs TO service_role;
ALTER TABLE public.mlm_commission_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read active commission configs"
  ON public.mlm_commission_configs FOR SELECT
  USING (is_active = true OR has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Admins manage commission configs"
  ON public.mlm_commission_configs FOR ALL
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));


-- Commandes hors-catalogue
CREATE TABLE public.custom_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_name text not null check (length(trim(product_name)) > 0),
  quantity integer not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  total_amount numeric(14,2) generated always as (quantity * unit_price) stored,
  delivery_latitude double precision not null,
  delivery_longitude double precision not null,
  delivery_address_text text,
  delivery_frequency text not null default 'once' check (delivery_frequency in ('once','daily','weekly','monthly')),
  delivery_details jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','in_transit','delivered','cancelled')),
  calculated_commission numeric(14,2) not null default 0,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX idx_custom_orders_user ON public.custom_orders(user_id, created_at DESC);
CREATE INDEX idx_custom_orders_status ON public.custom_orders(status, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.custom_orders TO authenticated;
GRANT ALL ON public.custom_orders TO service_role;
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own custom orders"
  ON public.custom_orders FOR SELECT
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'delivery_manager'::app_role)
  );

CREATE POLICY "Users create own custom orders"
  ON public.custom_orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can cancel own pending"
  ON public.custom_orders FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status IN ('pending','cancelled'));

CREATE POLICY "Staff manage custom orders"
  ON public.custom_orders FOR ALL
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'delivery_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'delivery_manager'::app_role));


-- Historique des commissions distribuées
CREATE TABLE public.custom_order_commissions (
  id uuid primary key default gen_random_uuid(),
  source_order_id uuid not null references public.custom_orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14,2) not null,
  level_depth integer not null,
  percentage_applied numeric(6,3) not null,
  created_at timestamptz not null default now()
);

CREATE INDEX idx_coc_user ON public.custom_order_commissions(user_id, created_at DESC);
CREATE INDEX idx_coc_source ON public.custom_order_commissions(source_order_id);

GRANT SELECT ON public.custom_order_commissions TO authenticated;
GRANT ALL ON public.custom_order_commissions TO service_role;
ALTER TABLE public.custom_order_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own commission history"
  ON public.custom_order_commissions FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));


-- =========================================================
-- 2) FONCTIONS
-- =========================================================

-- Calcule le montant total de commission à distribuer pour une commande
CREATE OR REPLACE FUNCTION public.compute_custom_order_commission(_order_id uuid)
RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _o public.custom_orders%ROWTYPE; _pct numeric := 0; _rule_pct numeric;
BEGIN
  SELECT * INTO _o FROM public.custom_orders WHERE id = _order_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  SELECT percentage INTO _pct FROM public.mlm_commission_configs
    WHERE is_active AND criteria_type = 'base'
    ORDER BY updated_at DESC LIMIT 1;
  _pct := COALESCE(_pct, 0);

  SELECT percentage INTO _rule_pct FROM public.mlm_commission_configs
    WHERE is_active AND criteria_type = 'frequency' AND criteria_value = _o.delivery_frequency
    ORDER BY updated_at DESC LIMIT 1;
  IF _rule_pct IS NOT NULL THEN _pct := _rule_pct; END IF;

  RETURN ROUND(_o.total_amount * _pct / 100, 2);
END; $$;


-- Distribue les commissions à la lignée ascendante (unilevel infini décroissant 50% par niveau)
CREATE OR REPLACE FUNCTION public.distribute_custom_order_commissions(_order_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _o public.custom_orders%ROWTYPE;
  _pool numeric;
  _sponsor uuid;
  _current uuid;
  _pct numeric := 100;
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

  _current := _o.user_id;
  LOOP
    _level := _level + 1;
    SELECT referred_by INTO _sponsor FROM public.profiles WHERE id = _current;
    EXIT WHEN _sponsor IS NULL;
    EXIT WHEN _pct < _min_pct;

    _commission := ROUND(_pool * _pct / 100, 2);
    IF _commission >= 1 THEN
      UPDATE public.wallets SET balance = balance + _commission, updated_at = now() WHERE user_id = _sponsor;
      INSERT INTO public.wallet_transactions(user_id, type, amount, status, notes)
      VALUES(_sponsor, 'commission'::transaction_type, _commission, 'approved'::transaction_status,
             'Commission niv ' || _level || ' commande hors-catalogue: ' || _o.product_name);
      INSERT INTO public.custom_order_commissions(source_order_id, user_id, amount, level_depth, percentage_applied)
      VALUES(_order_id, _sponsor, _commission, _level, _pct);
    END IF;

    _current := _sponsor;
    _pct := _pct / 2;
  END LOOP;
END; $$;


-- Trigger : déclenche la distribution quand statut passe à 'delivered'
CREATE OR REPLACE FUNCTION public.trg_custom_orders_after_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
    PERFORM public.distribute_custom_order_commissions(NEW.id);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER custom_orders_after_update
AFTER UPDATE ON public.custom_orders
FOR EACH ROW EXECUTE FUNCTION public.trg_custom_orders_after_update();


-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.trg_custom_orders_touch()
RETURNS trigger
LANGUAGE plpgsql SET search_path TO 'public'
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER custom_orders_touch
BEFORE UPDATE ON public.custom_orders
FOR EACH ROW EXECUTE FUNCTION public.trg_custom_orders_touch();


-- RPC : changement de statut par admin/livraison
CREATE OR REPLACE FUNCTION public.admin_update_custom_order_status(_id uuid, _status text, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'delivery_manager'::app_role)) THEN
    RAISE EXCEPTION 'Réservé aux administrateurs et gestionnaires livraison';
  END IF;
  IF _status NOT IN ('pending','in_transit','delivered','cancelled') THEN
    RAISE EXCEPTION 'Statut invalide';
  END IF;
  UPDATE public.custom_orders
     SET status = _status,
         admin_note = COALESCE(_note, admin_note)
   WHERE id = _id;
END; $$;


-- RPC : upsert config commission
CREATE OR REPLACE FUNCTION public.admin_upsert_commission_config(
  _id uuid, _rule_name text, _criteria_type text, _criteria_value text,
  _percentage numeric, _is_active boolean)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _cid uuid;
BEGIN
  IF NOT has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'Réservé aux administrateurs';
  END IF;
  IF _rule_name IS NULL OR length(trim(_rule_name)) = 0 THEN
    RAISE EXCEPTION 'Nom de règle requis';
  END IF;
  IF _percentage IS NULL OR _percentage < 0 OR _percentage > 100 THEN
    RAISE EXCEPTION 'Pourcentage invalide (0-100)';
  END IF;
  IF _id IS NULL THEN
    INSERT INTO public.mlm_commission_configs(rule_name, criteria_type, criteria_value, percentage, is_active)
    VALUES(_rule_name, _criteria_type, NULLIF(_criteria_value,''), _percentage, COALESCE(_is_active,true))
    RETURNING id INTO _cid;
  ELSE
    UPDATE public.mlm_commission_configs
       SET rule_name = _rule_name,
           criteria_type = _criteria_type,
           criteria_value = NULLIF(_criteria_value,''),
           percentage = _percentage,
           is_active = COALESCE(_is_active,true),
           updated_at = now()
     WHERE id = _id
     RETURNING id INTO _cid;
  END IF;
  RETURN _cid;
END; $$;


-- RPC : suppression config
CREATE OR REPLACE FUNCTION public.admin_delete_commission_config(_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'Réservé aux administrateurs';
  END IF;
  DELETE FROM public.mlm_commission_configs WHERE id = _id;
END; $$;


-- RPC : liste admin des commandes avec infos moissonneur
CREATE OR REPLACE FUNCTION public.admin_list_custom_orders()
RETURNS TABLE(
  id uuid, user_id uuid, first_name text, last_name text, referral_code text, phone text, country text,
  product_name text, quantity integer, unit_price numeric, total_amount numeric,
  delivery_latitude double precision, delivery_longitude double precision, delivery_address_text text,
  delivery_frequency text, delivery_details jsonb, status text, calculated_commission numeric,
  admin_note text, created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'delivery_manager'::app_role)) THEN
    RAISE EXCEPTION 'Réservé';
  END IF;
  RETURN QUERY
  SELECT co.id, co.user_id, p.first_name, p.last_name, p.referral_code, p.phone, p.country,
    co.product_name, co.quantity, co.unit_price, co.total_amount,
    co.delivery_latitude, co.delivery_longitude, co.delivery_address_text,
    co.delivery_frequency, co.delivery_details, co.status, co.calculated_commission,
    co.admin_note, co.created_at
  FROM public.custom_orders co
  LEFT JOIN public.profiles p ON p.id = co.user_id
  ORDER BY co.created_at DESC
  LIMIT 500;
END; $$;


-- =========================================================
-- 3) SEED : taux de base par défaut 5%
-- =========================================================
INSERT INTO public.mlm_commission_configs(rule_name, criteria_type, criteria_value, percentage, is_active)
VALUES('Taux de base commandes hors-catalogue', 'base', NULL, 5, true);


-- =========================================================
-- 4) REALTIME
-- =========================================================
ALTER TABLE public.custom_orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_orders;
