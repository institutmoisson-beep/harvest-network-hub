
-- Identity verification RPCs
CREATE OR REPLACE FUNCTION public.admin_set_identity_verified(_user_id uuid, _verified boolean, _reason text DEFAULT NULL::text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'identity_verifier'::app_role)) THEN
    RAISE EXCEPTION 'Réservé aux vérificateurs d''identité';
  END IF;
  UPDATE public.profiles
     SET identity_verified = _verified,
         identity_verified_at = CASE WHEN _verified THEN now() ELSE NULL END,
         identity_verified_by = CASE WHEN _verified THEN auth.uid() ELSE NULL END,
         identity_reject_reason = CASE WHEN _verified THEN NULL ELSE _reason END,
         updated_at = now()
   WHERE id = _user_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_identity_submissions()
 RETURNS TABLE(user_id uuid, full_name text, email text, phone text, referral_code text, id_moissonneur text, avatar_url text, id_photo_front text, id_photo_back text, identity_submitted_at timestamp with time zone, identity_verified boolean, identity_verified_at timestamp with time zone)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'identity_verifier'::app_role)) THEN
    RAISE EXCEPTION 'Réservé aux vérificateurs d''identité';
  END IF;
  RETURN QUERY
  SELECT pr.id,
         (COALESCE(pr.first_name,'')||' '||COALESCE(pr.last_name,''))::text,
         u.email::text, pr.phone, pr.referral_code, pr.id_moissonneur,
         pr.avatar_url, pr.id_photo_front, pr.id_photo_back,
         pr.identity_submitted_at, pr.identity_verified, pr.identity_verified_at
    FROM public.profiles pr
    LEFT JOIN auth.users u ON u.id = pr.id
   WHERE pr.id_photo_front IS NOT NULL OR pr.id_photo_back IS NOT NULL OR pr.avatar_url IS NOT NULL
   ORDER BY pr.identity_verified ASC NULLS FIRST, pr.identity_submitted_at DESC NULLS LAST;
END; $$;

-- Title verifier RPC
CREATE OR REPLACE FUNCTION public.verify_investment_document(_operation_id text)
 RETURNS TABLE(operation_id text, investment_id uuid, investment_date timestamp with time zone, user_id uuid, user_name text, user_email text, user_referral_code text, user_phone text, id_moissonneur text, project_id uuid, project_title text, project_category text, shares_purchased integer, total_amount_invested numeric, total_shares integer, available_before integer, shares_before integer, percentage_acquired numeric)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'title_verifier'::app_role)) THEN
    RAISE EXCEPTION 'Réservé aux vérificateurs de titres';
  END IF;
  RETURN QUERY
  SELECT i.operation_id, i.id, i.investment_date, i.user_id,
         (COALESCE(pr.first_name,'')||' '||COALESCE(pr.last_name,''))::text,
         u.email::text, pr.referral_code, pr.phone, pr.id_moissonneur,
         p.id, p.title, p.category,
         i.shares_purchased, i.total_amount_invested,
         p.total_shares, i.available_before, i.shares_before,
         CASE WHEN p.total_shares > 0 THEN ROUND((i.shares_purchased::numeric / p.total_shares::numeric)*100,4) ELSE 0 END
    FROM public.moisson_community_investments i
    JOIN public.moisson_projects p ON p.id = i.project_id
    LEFT JOIN public.profiles pr ON pr.id = i.user_id
    LEFT JOIN auth.users u ON u.id = i.user_id
   WHERE i.operation_id = _operation_id;
END; $$;

-- Grenier manager RPCs
CREATE OR REPLACE FUNCTION public.add_project_update(_project_id uuid, _title text, _content text, _image_url text DEFAULT NULL::text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'grenier_manager'::app_role)) THEN
    RAISE EXCEPTION 'Réservé';
  END IF;
  UPDATE public.moisson_projects SET
    update_feed = update_feed || jsonb_build_array(jsonb_build_object(
      'type','journal','date',now(),'title',_title,'content',_content,'image',_image_url
    )),
    updated_at = now()
  WHERE id = _project_id;
END; $$;

CREATE OR REPLACE FUNCTION public.distribute_dividends(_project_id uuid, _total_revenue numeric, _note text DEFAULT NULL::text)
 RETURNS TABLE(investors_paid integer, total_paid numeric)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _p public.moisson_projects%ROWTYPE; _inv RECORD; _payout numeric; _share_unit numeric;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'grenier_manager'::app_role)) THEN
    RAISE EXCEPTION 'Réservé';
  END IF;
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

-- Allow grenier_manager to manage projects directly (create/edit/delete)
DROP POLICY IF EXISTS "Admins manage projects" ON public.moisson_projects;
CREATE POLICY "Admins and grenier managers manage projects" ON public.moisson_projects
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'grenier_manager'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'grenier_manager'::app_role));
