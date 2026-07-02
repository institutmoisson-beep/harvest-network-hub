
DROP FUNCTION IF EXISTS public.invest_in_project(uuid, integer, text);

ALTER TABLE public.moisson_community_investments
  ADD COLUMN IF NOT EXISTS operation_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS shares_before integer,
  ADD COLUMN IF NOT EXISTS available_before integer;

CREATE OR REPLACE FUNCTION public.generate_investment_operation_id()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE _yr text := to_char(now(),'YYYY'); _rand text; _try int := 0;
BEGIN
  IF NEW.operation_id IS NOT NULL THEN RETURN NEW; END IF;
  LOOP
    _rand := lpad((floor(random()*100000))::int::text,5,'0');
    NEW.operation_id := 'MS-RECP-'||_yr||'-'||_rand;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.moisson_community_investments WHERE operation_id = NEW.operation_id);
    _try := _try+1;
    IF _try > 20 THEN
      NEW.operation_id := 'MS-RECP-'||_yr||'-'||substr(replace(gen_random_uuid()::text,'-',''),1,6);
      EXIT;
    END IF;
  END LOOP;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_investment_operation_id ON public.moisson_community_investments;
CREATE TRIGGER trg_investment_operation_id BEFORE INSERT ON public.moisson_community_investments
  FOR EACH ROW EXECUTE FUNCTION public.generate_investment_operation_id();

UPDATE public.moisson_community_investments
   SET operation_id = 'MS-RECP-'||to_char(investment_date,'YYYY')||'-'||substr(replace(id::text,'-',''),1,5)
 WHERE operation_id IS NULL;

CREATE FUNCTION public.invest_in_project(_project_id uuid, _shares int, _payment_method text DEFAULT 'wallet')
RETURNS TABLE(investment_id uuid, operation_id text, new_wallet_balance numeric, shares_sold int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _p public.moisson_projects%ROWTYPE; _total numeric;
        _w public.wallets%ROWTYPE; _inv public.moisson_community_investments%ROWTYPE; _shares_before int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  IF _shares IS NULL OR _shares <= 0 THEN RAISE EXCEPTION 'Nombre de parts invalide'; END IF;
  SELECT * INTO _p FROM public.moisson_projects WHERE id = _project_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Projet introuvable'; END IF;
  IF _p.status <> 'collecte' THEN RAISE EXCEPTION 'Le projet n''accepte plus d''investissement'; END IF;
  IF _p.shares_sold + _shares > _p.total_shares THEN RAISE EXCEPTION 'Pas assez de parts disponibles'; END IF;
  _shares_before := _p.shares_sold;
  _total := _shares * _p.share_price;
  IF _payment_method = 'wallet' THEN
    SELECT * INTO _w FROM public.wallets WHERE user_id = _uid FOR UPDATE;
    IF _w.balance < _total THEN RAISE EXCEPTION 'Solde insuffisant'; END IF;
    UPDATE public.wallets SET balance = balance - _total, updated_at = now() WHERE id = _w.id RETURNING balance INTO new_wallet_balance;
    INSERT INTO public.wallet_transactions(user_id, type, amount, status, notes)
    VALUES(_uid,'achat'::transaction_type,_total,'approved'::transaction_status,'Investissement Grenier: '||_p.title);
  ELSE
    SELECT balance INTO new_wallet_balance FROM public.wallets WHERE user_id = _uid;
  END IF;
  INSERT INTO public.moisson_community_investments(user_id, project_id, shares_purchased, total_amount_invested, payment_method, shares_before, available_before)
  VALUES(_uid,_project_id,_shares,_total,_payment_method,_shares_before,_p.total_shares - _shares_before)
  RETURNING * INTO _inv;
  UPDATE public.moisson_projects SET shares_sold = shares_sold + _shares, updated_at = now() WHERE id = _project_id RETURNING shares_sold INTO shares_sold;
  investment_id := _inv.id; operation_id := _inv.operation_id;
  RETURN NEXT;
END; $$;
GRANT EXECUTE ON FUNCTION public.invest_in_project(uuid,int,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_investment_document(_operation_id text)
RETURNS TABLE(
  operation_id text, investment_id uuid, investment_date timestamptz,
  user_id uuid, user_name text, user_email text, user_referral_code text, user_phone text, id_moissonneur text,
  project_id uuid, project_title text, project_category text,
  shares_purchased int, total_amount_invested numeric,
  total_shares int, available_before int, shares_before int,
  percentage_acquired numeric
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(),'admin'::app_role) THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
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
GRANT EXECUTE ON FUNCTION public.verify_investment_document(text) TO authenticated;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS id_photo_front text,
  ADD COLUMN IF NOT EXISTS id_photo_back text,
  ADD COLUMN IF NOT EXISTS identity_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS identity_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS identity_verified_by uuid,
  ADD COLUMN IF NOT EXISTS identity_reject_reason text;

CREATE OR REPLACE FUNCTION public.admin_set_identity_verified(_user_id uuid, _verified boolean, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(),'admin'::app_role) THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
  UPDATE public.profiles
     SET identity_verified = _verified,
         identity_verified_at = CASE WHEN _verified THEN now() ELSE NULL END,
         identity_verified_by = CASE WHEN _verified THEN auth.uid() ELSE NULL END,
         identity_reject_reason = CASE WHEN _verified THEN NULL ELSE _reason END,
         updated_at = now()
   WHERE id = _user_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_set_identity_verified(uuid, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_identity_submissions()
RETURNS TABLE(user_id uuid, full_name text, email text, phone text, referral_code text, id_moissonneur text,
              avatar_url text, id_photo_front text, id_photo_back text,
              identity_submitted_at timestamptz, identity_verified boolean, identity_verified_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(),'admin'::app_role) THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
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
GRANT EXECUTE ON FUNCTION public.admin_list_identity_submissions() TO authenticated;

DROP POLICY IF EXISTS "Users manage own avatar" ON storage.objects;
CREATE POLICY "Users manage own avatar" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Admin reads avatars" ON storage.objects;
CREATE POLICY "Admin reads avatars" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Users manage own identity docs" ON storage.objects;
CREATE POLICY "Users manage own identity docs" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'identity-docs' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'identity-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Admin reads identity docs" ON storage.objects;
CREATE POLICY "Admin reads identity docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'identity-docs' AND has_role(auth.uid(),'admin'::app_role));
