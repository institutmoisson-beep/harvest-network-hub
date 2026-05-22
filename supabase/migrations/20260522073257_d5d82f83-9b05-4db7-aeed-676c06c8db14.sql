CREATE OR REPLACE FUNCTION public.purchase_pack_product(
  _product_id uuid,
  _shipping_address_id uuid DEFAULT NULL
)
RETURNS TABLE(order_id uuid, new_balance numeric, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _product public.products%ROWTYPE;
  _wallet public.wallets%ROWTYPE;
  _order_id uuid;
  _current_user uuid;
  _sponsor_id uuid;
  _level integer := 0;
  _pct numeric;
  _commission numeric;
  _last_pct numeric := 0;
  _max_level integer := 0;
  _min_pct numeric := 0.01;
  _rate record;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non connecté';
  END IF;

  SELECT * INTO _product FROM public.products WHERE id = _product_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pack introuvable ou inactif';
  END IF;

  IF _product.is_physical AND _shipping_address_id IS NULL THEN
    RAISE EXCEPTION 'Adresse de livraison requise';
  END IF;

  IF _shipping_address_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.shipping_addresses WHERE id = _shipping_address_id AND user_id = _user_id
  ) THEN
    RAISE EXCEPTION 'Adresse de livraison invalide';
  END IF;

  SELECT * INTO _wallet FROM public.wallets WHERE user_id = _user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portefeuille introuvable';
  END IF;

  IF _wallet.balance < _product.price THEN
    RAISE EXCEPTION 'Solde insuffisant. Solde disponible: % FCFA', _wallet.balance;
  END IF;

  UPDATE public.wallets
  SET balance = balance - _product.price, updated_at = now()
  WHERE id = _wallet.id
  RETURNING balance INTO new_balance;

  INSERT INTO public.orders (user_id, product_id, company_id, shipping_address_id, total_price, status)
  VALUES (_user_id, _product.id, _product.company_id, _shipping_address_id, _product.price, 'confirmed'::order_status)
  RETURNING id INTO _order_id;

  INSERT INTO public.wallet_transactions (user_id, type, amount, status, notes)
  VALUES (_user_id, 'achat'::transaction_type, _product.price, 'approved'::transaction_status, 'Achat pack: ' || _product.name);

  IF _product.activates_system THEN
    UPDATE public.profiles SET is_system_active = true, updated_at = now() WHERE id = _user_id;
  END IF;

  SELECT COALESCE(max(level), 0) INTO _max_level FROM public.pack_commission_rates WHERE product_id = _product.id;
  IF _max_level > 0 THEN
    SELECT percentage INTO _last_pct FROM public.pack_commission_rates WHERE product_id = _product.id ORDER BY level DESC LIMIT 1;
  END IF;

  _current_user := _user_id;
  LOOP
    _level := _level + 1;
    SELECT referred_by INTO _sponsor_id FROM public.profiles WHERE id = _current_user;
    EXIT WHEN _sponsor_id IS NULL;

    SELECT percentage INTO _pct FROM public.pack_commission_rates WHERE product_id = _product.id AND level = _level LIMIT 1;

    IF _pct IS NULL THEN
      IF _max_level > 0 AND _last_pct > _min_pct THEN
        _pct := _last_pct / power(2, _level - _max_level);
      ELSE
        EXIT;
      END IF;
    END IF;

    EXIT WHEN _pct < _min_pct;
    _commission := (_product.price * _pct) / 100;

    IF _commission >= 1 THEN
      UPDATE public.wallets SET balance = balance + _commission, updated_at = now() WHERE user_id = _sponsor_id;
      INSERT INTO public.wallet_transactions (user_id, type, amount, status, notes)
      VALUES (_sponsor_id, 'commission'::transaction_type, _commission, 'approved'::transaction_status, 'Commission niveau ' || _level || ' sur achat pack');
      INSERT INTO public.commissions (user_id, source_user_id, order_id, amount, level, description)
      VALUES (_sponsor_id, _user_id, _order_id, _commission, _level, 'Commission pack niveau ' || _level);
    END IF;

    _current_user := _sponsor_id;
  END LOOP;

  order_id := _order_id;
  message := 'Achat effectué avec succès';
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purchase_pack_product(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purchase_pack_product(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.purchase_pack_product(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.purchase_commerce_product(uuid, integer, public.commerce_payment_method, uuid, uuid, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purchase_commerce_product(uuid, integer, public.commerce_payment_method, uuid, uuid, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.purchase_commerce_product(uuid, integer, public.commerce_payment_method, uuid, uuid, text, text, text) TO authenticated;