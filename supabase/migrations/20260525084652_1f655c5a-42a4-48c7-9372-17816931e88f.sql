CREATE OR REPLACE FUNCTION public.contribute_to_fund(_amount numeric)
RETURNS TABLE(new_wallet_balance numeric, new_fund_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _w public.wallets%ROWTYPE;
  _fund_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Montant invalide';
  END IF;

  SELECT * INTO _w
  FROM public.wallets
  WHERE user_id = _uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portefeuille introuvable';
  END IF;

  IF _w.balance < _amount THEN
    RAISE EXCEPTION 'Solde insuffisant';
  END IF;

  SELECT id INTO _fund_id
  FROM public.community_fund
  ORDER BY updated_at ASC
  LIMIT 1
  FOR UPDATE;

  IF _fund_id IS NULL THEN
    INSERT INTO public.community_fund (balance)
    VALUES (0)
    RETURNING id INTO _fund_id;
  END IF;

  UPDATE public.wallets
  SET balance = balance - _amount,
      updated_at = now()
  WHERE id = _w.id
  RETURNING balance INTO new_wallet_balance;

  UPDATE public.community_fund
  SET balance = balance + _amount,
      updated_at = now()
  WHERE id = _fund_id
  RETURNING balance INTO new_fund_balance;

  INSERT INTO public.wallet_transactions(user_id, type, amount, status, notes)
  VALUES(_uid, 'achat'::transaction_type, _amount, 'approved'::transaction_status, 'Contribution au fonds communautaire');

  INSERT INTO public.community_fund_transactions(type, amount, user_id)
  VALUES('contribution', _amount, _uid);

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.withdraw_from_fund(_amount numeric, _reason text, _emergency_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(new_fund_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _fund_id uuid;
  _current_balance numeric;
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Réservé aux administrateurs';
  END IF;

  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Montant invalide';
  END IF;

  IF _reason IS NULL OR length(trim(_reason)) < 3 THEN
    RAISE EXCEPTION 'Motif requis';
  END IF;

  SELECT id, balance INTO _fund_id, _current_balance
  FROM public.community_fund
  ORDER BY updated_at ASC
  LIMIT 1
  FOR UPDATE;

  IF _fund_id IS NULL THEN
    INSERT INTO public.community_fund (balance)
    VALUES (0)
    RETURNING id, balance INTO _fund_id, _current_balance;
  END IF;

  IF _current_balance < _amount THEN
    RAISE EXCEPTION 'Fonds insuffisants';
  END IF;

  UPDATE public.community_fund
  SET balance = balance - _amount,
      updated_at = now()
  WHERE id = _fund_id
  RETURNING balance INTO new_fund_balance;

  INSERT INTO public.community_fund_transactions(type, amount, admin_id, reason, emergency_id)
  VALUES('withdrawal', _amount, _uid, _reason, _emergency_id);

  RETURN NEXT;
END;
$$;