
CREATE OR REPLACE FUNCTION public.transfer_to_user(_recipient_code text, _amount numeric, _note text DEFAULT NULL)
RETURNS TABLE(new_balance numeric, recipient_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _recipient_id uuid;
  _recipient_first text;
  _recipient_last text;
  _sender_wallet public.wallets%ROWTYPE;
  _recipient_wallet public.wallets%ROWTYPE;
  _first_id uuid;
  _second_id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Montant invalide'; END IF;

  SELECT id, first_name, last_name INTO _recipient_id, _recipient_first, _recipient_last
  FROM public.profiles WHERE referral_code = upper(_recipient_code) LIMIT 1;

  IF _recipient_id IS NULL THEN RAISE EXCEPTION 'Destinataire introuvable'; END IF;
  IF _recipient_id = _uid THEN RAISE EXCEPTION 'Impossible de se transférer à soi-même'; END IF;

  IF _uid < _recipient_id THEN
    _first_id := _uid; _second_id := _recipient_id;
  ELSE
    _first_id := _recipient_id; _second_id := _uid;
  END IF;

  PERFORM 1 FROM public.wallets WHERE user_id = _first_id FOR UPDATE;
  PERFORM 1 FROM public.wallets WHERE user_id = _second_id FOR UPDATE;

  SELECT * INTO _sender_wallet FROM public.wallets WHERE user_id = _uid;
  SELECT * INTO _recipient_wallet FROM public.wallets WHERE user_id = _recipient_id;

  IF _sender_wallet.id IS NULL THEN RAISE EXCEPTION 'Portefeuille émetteur introuvable'; END IF;
  IF _recipient_wallet.id IS NULL THEN RAISE EXCEPTION 'Portefeuille destinataire introuvable'; END IF;
  IF _sender_wallet.balance < _amount THEN RAISE EXCEPTION 'Solde insuffisant'; END IF;

  UPDATE public.wallets SET balance = balance - _amount, updated_at = now()
  WHERE id = _sender_wallet.id RETURNING balance INTO new_balance;

  UPDATE public.wallets SET balance = balance + _amount, updated_at = now()
  WHERE id = _recipient_wallet.id;

  INSERT INTO public.wallet_transactions(user_id, type, amount, status, recipient_id, notes)
  VALUES(_uid, 'transfert'::transaction_type, _amount, 'approved'::transaction_status, _recipient_id,
         COALESCE(_note, 'Transfert à ' || _recipient_first || ' ' || _recipient_last));

  INSERT INTO public.wallet_transactions(user_id, type, amount, status, recipient_id, notes)
  VALUES(_recipient_id, 'transfert'::transaction_type, _amount, 'approved'::transaction_status, _uid,
         'Transfert reçu de ' || COALESCE((SELECT first_name || ' ' || last_name FROM public.profiles WHERE id = _uid), 'Moissonneur'));

  recipient_name := _recipient_first || ' ' || _recipient_last;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.transfer_to_user(text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_to_user(text, numeric, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.move_referral_position(_member_id uuid, _new_position text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _sponsor uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  IF _new_position NOT IN ('left','right') THEN RAISE EXCEPTION 'Position invalide'; END IF;
  SELECT sponsor_id INTO _sponsor FROM public.network WHERE user_id = _member_id;
  IF _sponsor IS NULL THEN RAISE EXCEPTION 'Membre introuvable dans le réseau'; END IF;
  IF NOT (public.has_role(_uid, 'admin'::app_role) OR _sponsor = _uid) THEN
    RAISE EXCEPTION 'Action non autorisée';
  END IF;
  UPDATE public.network SET position = _new_position WHERE user_id = _member_id;
END;
$$;

REVOKE ALL ON FUNCTION public.move_referral_position(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_referral_position(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_my_referrals()
RETURNS TABLE(
  member_id uuid, first_name text, last_name text, referral_code text,
  country text, phone text, career_level career_level,
  is_system_active boolean, branch_position text, joined_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.first_name, p.last_name, p.referral_code,
         p.country, p.phone, p.career_level,
         p.is_system_active, n.position, p.created_at
  FROM public.profiles p
  JOIN public.network n ON n.user_id = p.id
  WHERE n.sponsor_id = auth.uid()
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_referrals() TO authenticated;

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_recipient ON public.wallet_transactions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_network_sponsor ON public.network(sponsor_id);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.wallets REPLICA IDENTITY FULL;
ALTER TABLE public.wallet_transactions REPLICA IDENTITY FULL;
