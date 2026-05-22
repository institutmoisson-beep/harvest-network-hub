DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commerce_product_kind') THEN
    CREATE TYPE public.commerce_product_kind AS ENUM ('wholesale', 'distribution');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commerce_order_status') THEN
    CREATE TYPE public.commerce_order_status AS ENUM ('pending', 'paid', 'confirmed', 'shipped', 'delivered', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commerce_payment_method') THEN
    CREATE TYPE public.commerce_payment_method AS ENUM ('wallet', 'cash_on_delivery');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.commerce_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.commerce_product_kind NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'FCFA',
  min_quantity integer NOT NULL DEFAULT 1,
  available_quantity integer,
  pv_value numeric NOT NULL DEFAULT 0,
  commission_percentage numeric NOT NULL DEFAULT 0,
  partner_name text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.commerce_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.commerce_products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  proposer_id uuid,
  client_name text,
  client_phone text,
  client_note text,
  quantity integer NOT NULL DEFAULT 1,
  total_price numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  payment_method public.commerce_payment_method NOT NULL DEFAULT 'wallet',
  status public.commerce_order_status NOT NULL DEFAULT 'pending',
  shipping_address_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commerce_products_kind_active ON public.commerce_products(kind, is_active);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_user_created ON public.commerce_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_proposer_created ON public.commerce_orders(proposer_id, created_at DESC);

ALTER TABLE public.commerce_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and managers can manage commerce products" ON public.commerce_products;
CREATE POLICY "Admins and managers can manage commerce products"
ON public.commerce_products
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'pack_manager'::app_role) OR public.has_role(auth.uid(), 'partner_manager'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'pack_manager'::app_role) OR public.has_role(auth.uid(), 'partner_manager'::app_role));

DROP POLICY IF EXISTS "Anyone can read active commerce products" ON public.commerce_products;
CREATE POLICY "Anyone can read active commerce products"
ON public.commerce_products
FOR SELECT
TO public
USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'pack_manager'::app_role) OR public.has_role(auth.uid(), 'partner_manager'::app_role));

DROP POLICY IF EXISTS "Admins and managers can manage commerce orders" ON public.commerce_orders;
CREATE POLICY "Admins and managers can manage commerce orders"
ON public.commerce_orders
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'pack_manager'::app_role) OR public.has_role(auth.uid(), 'partner_manager'::app_role) OR public.has_role(auth.uid(), 'financier'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'pack_manager'::app_role) OR public.has_role(auth.uid(), 'partner_manager'::app_role) OR public.has_role(auth.uid(), 'financier'::app_role));

DROP POLICY IF EXISTS "Users can read own commerce orders" ON public.commerce_orders;
CREATE POLICY "Users can read own commerce orders"
ON public.commerce_orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR proposer_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own commerce orders" ON public.commerce_orders;
CREATE POLICY "Users can create own commerce orders"
ON public.commerce_orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR proposer_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own commerce orders" ON public.commerce_orders;
CREATE POLICY "Users can update own commerce orders"
ON public.commerce_orders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR proposer_id = auth.uid())
WITH CHECK (user_id = auth.uid() OR proposer_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.purchase_commerce_product(
  _product_id uuid,
  _quantity integer,
  _payment_method public.commerce_payment_method,
  _shipping_address_id uuid DEFAULT NULL,
  _proposer_id uuid DEFAULT NULL,
  _client_name text DEFAULT NULL,
  _client_phone text DEFAULT NULL,
  _client_note text DEFAULT NULL
)
RETURNS TABLE(order_id uuid, new_balance numeric, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _product public.commerce_products%ROWTYPE;
  _wallet public.wallets%ROWTYPE;
  _total numeric;
  _commission numeric;
  _order_id uuid;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non connecté';
  END IF;

  SELECT * INTO _product FROM public.commerce_products WHERE id = _product_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit introuvable ou inactif';
  END IF;

  IF _quantity IS NULL OR _quantity < _product.min_quantity THEN
    RAISE EXCEPTION 'Quantité minimale requise: %', _product.min_quantity;
  END IF;

  _total := _product.price * _quantity;
  _commission := CASE WHEN _proposer_id IS NOT NULL AND _proposer_id <> _user_id THEN (_total * _product.commission_percentage / 100) ELSE 0 END;

  IF _payment_method = 'wallet' THEN
    SELECT * INTO _wallet FROM public.wallets WHERE user_id = _user_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Portefeuille introuvable';
    END IF;
    IF _wallet.balance < _total THEN
      RAISE EXCEPTION 'Solde insuffisant. Solde disponible: % FCFA', _wallet.balance;
    END IF;

    UPDATE public.wallets SET balance = balance - _total, updated_at = now() WHERE id = _wallet.id RETURNING balance INTO new_balance;
    INSERT INTO public.wallet_transactions (user_id, type, amount, status, notes)
    VALUES (_user_id, 'achat'::transaction_type, _total, 'approved'::transaction_status, 'Achat ' || _product.name || ' x' || _quantity);
  ELSE
    SELECT balance INTO new_balance FROM public.wallets WHERE user_id = _user_id;
  END IF;

  INSERT INTO public.commerce_orders (product_id, user_id, proposer_id, client_name, client_phone, client_note, quantity, total_price, commission_amount, payment_method, status, shipping_address_id)
  VALUES (_product_id, _user_id, _proposer_id, _client_name, _client_phone, _client_note, _quantity, _total, _commission, _payment_method, CASE WHEN _payment_method = 'wallet' THEN 'paid'::commerce_order_status ELSE 'pending'::commerce_order_status END, _shipping_address_id)
  RETURNING id INTO _order_id;

  IF _commission > 0 AND _payment_method = 'wallet' THEN
    UPDATE public.wallets SET balance = balance + _commission, updated_at = now() WHERE user_id = _proposer_id;
    INSERT INTO public.wallet_transactions (user_id, type, amount, status, notes)
    VALUES (_proposer_id, 'commission'::transaction_type, _commission, 'approved'::transaction_status, 'Commission proposition client: ' || _product.name);
    INSERT INTO public.commissions (user_id, source_user_id, amount, level, description)
    VALUES (_proposer_id, _user_id, _commission, 1, 'Commission produit en gros / distribution');
  END IF;

  IF _product.available_quantity IS NOT NULL THEN
    UPDATE public.commerce_products SET available_quantity = GREATEST(0, available_quantity - _quantity), updated_at = now() WHERE id = _product_id;
  END IF;

  order_id := _order_id;
  message := 'Commande enregistrée';
  RETURN NEXT;
END;
$$;