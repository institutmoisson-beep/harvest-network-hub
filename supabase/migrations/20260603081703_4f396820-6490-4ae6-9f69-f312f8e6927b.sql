
-- 1. CGU columns on profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS cgu_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cgu_accepted_at timestamptz;

-- 2. Seed 10 career grades (idempotent on name)
INSERT INTO public.career_grades(name, description, min_revenue, min_active_referrals, min_downline_size, weekly_bonus, monthly_bonus, display_order, is_active)
VALUES
  ('Le Semeur','Valider son adhésion et posséder son kit de démarrage.',0,0,0,0,0,1,true),
  ('Le Germinateur','Avoir 2 filleuls actifs dans la même semaine.',250000,2,2,15000,0,2,true),
  ('Le Cultivateur','Maintenir activité régulière sur sa structure.',750000,3,5,30000,0,3,true),
  ('L''Irrigateur','CA réparti sur au moins 2 branches (max 70% sur une).',2000000,4,15,80000,20000,4,true),
  ('Le Moissonneur Junior','Avoir formé personnellement ses 2 Cultivateurs.',5000000,5,30,250000,50000,5,true),
  ('Le Maître Moissonneur','Valider l''atteinte du grade sur 2 mois consécutifs.',12000000,6,60,720000,100000,6,true),
  ('L''Intendant des Terres','Max 50% du CA global sur une seule lignée.',30000000,8,120,2100000,200000,7,true),
  ('Le Propriétaire du Domaine','Animer au moins une formation officielle par mois.',75000000,10,250,6000000,400000,8,true),
  ('L''Ambassadeur du Grenier','Taux de rétention d''équipe ≥ 60%.',150000000,12,500,13500000,750000,9,true),
  ('Le Moissonneur Éternel','Siéger au conseil consultatif. Légende du Réseau.',400000000,15,1000,40000000,1500000,10,true)
ON CONFLICT DO NOTHING;

-- 3. Auto-assign grade function
CREATE OR REPLACE FUNCTION public.auto_assign_user_grade(_user_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _revenue numeric;
  _active_refs int;
  _downline int;
  _best_grade public.career_grades%ROWTYPE;
  _has_manual boolean;
BEGIN
  -- Don't override manual assignments (notes != '' indicates manual)
  SELECT EXISTS(SELECT 1 FROM public.user_career_overrides WHERE user_id = _user_id AND notes IS NOT NULL AND notes <> '' AND notes <> 'auto')
    INTO _has_manual;
  IF _has_manual THEN RETURN NULL; END IF;

  SELECT 
    COALESCE((SELECT SUM(total_price) FROM public.orders WHERE user_id = _user_id), 0)
    + COALESCE((SELECT SUM(total_price) FROM public.commerce_orders WHERE user_id = _user_id), 0)
  INTO _revenue;

  SELECT COUNT(*)::int INTO _active_refs
    FROM public.profiles pp JOIN public.network n ON n.user_id = pp.id
    WHERE n.sponsor_id = _user_id AND pp.is_system_active;

  SELECT COUNT(*)::int INTO _downline FROM public.get_downline(_user_id);

  SELECT * INTO _best_grade FROM public.career_grades
    WHERE is_active = true
      AND min_revenue <= _revenue
      AND min_active_referrals <= _active_refs
      AND min_downline_size <= _downline
    ORDER BY display_order DESC LIMIT 1;

  IF _best_grade.id IS NOT NULL THEN
    INSERT INTO public.user_career_overrides(user_id, grade_id, custom_weekly_bonus, custom_monthly_bonus, notes, assigned_by)
    VALUES(_user_id, _best_grade.id, _best_grade.weekly_bonus, _best_grade.monthly_bonus, 'auto', NULL)
    ON CONFLICT (user_id) DO UPDATE SET
      grade_id = EXCLUDED.grade_id,
      custom_weekly_bonus = EXCLUDED.custom_weekly_bonus,
      custom_monthly_bonus = EXCLUDED.custom_monthly_bonus,
      notes = 'auto',
      assigned_at = now();
  END IF;
  RETURN _best_grade.id;
END; $$;

-- Public RPC so admin or self can refresh
CREATE OR REPLACE FUNCTION public.recalc_my_grade()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  RETURN public.auto_assign_user_grade(auth.uid());
END; $$;

CREATE OR REPLACE FUNCTION public.recalc_all_grades()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u uuid; _c int := 0;
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role)) THEN
    RAISE EXCEPTION 'Réservé';
  END IF;
  FOR _u IN SELECT id FROM public.profiles LOOP
    PERFORM public.auto_assign_user_grade(_u);
    _c := _c + 1;
  END LOOP;
  RETURN _c;
END; $$;

-- Trigger after order insert
CREATE OR REPLACE FUNCTION public.trg_auto_grade_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.auto_assign_user_grade(NEW.user_id);
  -- also recompute sponsor (active referral count may change)
  PERFORM public.auto_assign_user_grade(p.referred_by) FROM public.profiles p WHERE p.id = NEW.user_id AND p.referred_by IS NOT NULL;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS auto_grade_on_order ON public.orders;
CREATE TRIGGER auto_grade_on_order AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.trg_auto_grade_order();

DROP TRIGGER IF EXISTS auto_grade_on_commerce ON public.commerce_orders;
CREATE TRIGGER auto_grade_on_commerce AFTER INSERT ON public.commerce_orders FOR EACH ROW EXECUTE FUNCTION public.trg_auto_grade_order();

-- =========================================================
-- 4. LE GRENIER DES MOISSONNEURS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.moisson_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Autre',
  description text NOT NULL DEFAULT '',
  global_target numeric NOT NULL DEFAULT 0,
  share_price numeric NOT NULL DEFAULT 10000,
  total_shares integer NOT NULL DEFAULT 0,
  shares_sold integer NOT NULL DEFAULT 0,
  estimated_roi numeric NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'collecte',
  cover_image text,
  update_feed jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.moisson_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.moisson_projects TO authenticated;
GRANT ALL ON public.moisson_projects TO service_role;
ALTER TABLE public.moisson_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads projects" ON public.moisson_projects FOR SELECT USING (true);
CREATE POLICY "Admins manage projects" ON public.moisson_projects FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.moisson_community_investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.moisson_projects(id) ON DELETE CASCADE,
  shares_purchased integer NOT NULL,
  total_amount_invested numeric NOT NULL,
  payout_received numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'wallet',
  contract_signed_url text,
  investment_date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.moisson_community_investments TO authenticated;
GRANT ALL ON public.moisson_community_investments TO service_role;
ALTER TABLE public.moisson_community_investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User reads own investments" ON public.moisson_community_investments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "User creates own investment" ON public.moisson_community_investments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin manages investments" ON public.moisson_community_investments FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Purchase shares RPC
CREATE OR REPLACE FUNCTION public.invest_in_project(_project_id uuid, _shares int, _payment_method text DEFAULT 'wallet')
RETURNS TABLE(investment_id uuid, new_wallet_balance numeric, shares_sold int) 
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _p public.moisson_projects%ROWTYPE;
  _total numeric;
  _w public.wallets%ROWTYPE;
  _inv_id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  IF _shares IS NULL OR _shares <= 0 THEN RAISE EXCEPTION 'Nombre de parts invalide'; END IF;

  SELECT * INTO _p FROM public.moisson_projects WHERE id = _project_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Projet introuvable'; END IF;
  IF _p.status <> 'collecte' THEN RAISE EXCEPTION 'Le projet n''accepte plus d''investissement'; END IF;
  IF _p.shares_sold + _shares > _p.total_shares THEN RAISE EXCEPTION 'Pas assez de parts disponibles'; END IF;

  _total := _shares * _p.share_price;

  IF _payment_method = 'wallet' THEN
    SELECT * INTO _w FROM public.wallets WHERE user_id = _uid FOR UPDATE;
    IF _w.balance < _total THEN RAISE EXCEPTION 'Solde insuffisant'; END IF;
    UPDATE public.wallets SET balance = balance - _total, updated_at = now() WHERE id = _w.id RETURNING balance INTO new_wallet_balance;
    INSERT INTO public.wallet_transactions(user_id, type, amount, status, notes)
    VALUES(_uid, 'achat'::transaction_type, _total, 'approved'::transaction_status, 'Investissement Grenier: ' || _p.title);
  ELSE
    SELECT balance INTO new_wallet_balance FROM public.wallets WHERE user_id = _uid;
  END IF;

  INSERT INTO public.moisson_community_investments(user_id, project_id, shares_purchased, total_amount_invested, payment_method)
  VALUES(_uid, _project_id, _shares, _total, _payment_method)
  RETURNING id INTO _inv_id;

  UPDATE public.moisson_projects SET shares_sold = shares_sold + _shares, updated_at = now() WHERE id = _project_id RETURNING shares_sold INTO shares_sold;

  investment_id := _inv_id;
  RETURN NEXT;
END; $$;

-- Distribute dividends RPC
CREATE OR REPLACE FUNCTION public.distribute_dividends(_project_id uuid, _total_revenue numeric, _note text DEFAULT NULL)
RETURNS TABLE(investors_paid int, total_paid numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _p public.moisson_projects%ROWTYPE;
  _inv RECORD;
  _payout numeric;
  _share_unit numeric;
BEGIN
  IF NOT has_role(auth.uid(),'admin'::app_role) THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
  SELECT * INTO _p FROM public.moisson_projects WHERE id = _project_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Projet introuvable'; END IF;
  IF _p.shares_sold <= 0 THEN RAISE EXCEPTION 'Aucune part vendue'; END IF;
  
  _share_unit := _total_revenue / _p.shares_sold;
  investors_paid := 0; total_paid := 0;

  FOR _inv IN SELECT * FROM public.moisson_community_investments WHERE project_id = _project_id LOOP
    _payout := _share_unit * _inv.shares_purchased;
    UPDATE public.wallets SET balance = balance + _payout, updated_at = now() WHERE user_id = _inv.user_id;
    UPDATE public.moisson_community_investments SET payout_received = payout_received + _payout WHERE id = _inv.id;
    INSERT INTO public.wallet_transactions(user_id, type, amount, status, notes)
    VALUES(_inv.user_id, 'commission'::transaction_type, _payout, 'approved'::transaction_status,
           'Dividende Grenier: ' || _p.title || COALESCE(' — ' || _note, ''));
    investors_paid := investors_paid + 1;
    total_paid := total_paid + _payout;
  END LOOP;

  UPDATE public.moisson_projects SET 
    update_feed = update_feed || jsonb_build_array(jsonb_build_object(
      'type','payout','date',now(),'revenue',_total_revenue,'note',COALESCE(_note,''),'investors',investors_paid
    )),
    updated_at = now()
  WHERE id = _project_id;
  RETURN NEXT;
END; $$;

-- Add journal update
CREATE OR REPLACE FUNCTION public.add_project_update(_project_id uuid, _title text, _content text, _image_url text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(),'admin'::app_role) THEN RAISE EXCEPTION 'Réservé'; END IF;
  UPDATE public.moisson_projects SET 
    update_feed = update_feed || jsonb_build_array(jsonb_build_object(
      'type','journal','date',now(),'title',_title,'content',_content,'image',_image_url
    )),
    updated_at = now()
  WHERE id = _project_id;
END; $$;

-- CGU accept RPC
CREATE OR REPLACE FUNCTION public.accept_cgu()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  UPDATE public.profiles SET cgu_accepted = true, cgu_accepted_at = now() WHERE id = auth.uid();
END; $$;

-- Seed 2 example projects
INSERT INTO public.moisson_projects(title, category, description, global_target, share_price, total_shares, estimated_roi, status, cover_image)
VALUES
  ('Lumière d''Abidjan — Long métrage','Cinéma','Production d''un long métrage panafricain mettant en lumière les talents émergents de Côte d''Ivoire. Distribution internationale prévue avec partenariats streaming.',50000000,10000,5000,18,'collecte','https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800'),
  ('Plantation de cacao bio — Daloa','Agrobusiness','Mise en place de 25 hectares de cacao biologique certifié, avec circuit court vers chocolatiers européens. Premières récoltes attendues sous 24 mois.',30000000,10000,3000,22,'collecte','https://images.unsplash.com/photo-1559717865-a99cac1c95d8?w=800')
ON CONFLICT DO NOTHING;
