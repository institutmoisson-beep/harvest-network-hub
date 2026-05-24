-- Community fund (single row)
CREATE TABLE public.community_fund (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.community_fund (balance) VALUES (0);

ALTER TABLE public.community_fund ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read fund" ON public.community_fund FOR SELECT USING (true);
CREATE POLICY "Admins manage fund" ON public.community_fund FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

-- Fund transactions
CREATE TYPE public.fund_tx_type AS ENUM ('contribution','withdrawal');

CREATE TABLE public.community_fund_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.fund_tx_type NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  user_id uuid,             -- contributor (null for admin withdrawal)
  admin_id uuid,            -- admin executing withdrawal
  reason text,              -- mandatory for withdrawal
  emergency_id uuid,        -- optional linked emergency
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_fund_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read fund tx" ON public.community_fund_transactions FOR SELECT USING (true);
CREATE POLICY "Admins manage fund tx" ON public.community_fund_transactions FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

-- Emergencies
CREATE TYPE public.emergency_status AS ENUM ('open','in_progress','resolved','rejected');
CREATE TYPE public.emergency_frequency AS ENUM ('ponctuelle','recurrente','urgente_critique','quotidienne','hebdomadaire');

CREATE TABLE public.emergencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  frequency public.emergency_frequency NOT NULL DEFAULT 'ponctuelle',
  amount_requested numeric,
  status public.emergency_status NOT NULL DEFAULT 'open',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.emergencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own emergencies" ON public.emergencies FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users create own emergencies" ON public.emergencies FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own emergencies" ON public.emergencies FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins manage all emergencies" ON public.emergencies FOR ALL USING (has_role(auth.uid(),'admin'::app_role));

-- Emergency chat
CREATE TABLE public.emergency_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id uuid NOT NULL REFERENCES public.emergencies(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.emergency_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read messages" ON public.emergency_messages FOR SELECT USING (
  has_role(auth.uid(),'admin'::app_role) OR EXISTS (SELECT 1 FROM public.emergencies e WHERE e.id = emergency_id AND e.user_id = auth.uid())
);
CREATE POLICY "Participants send messages" ON public.emergency_messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND (
    has_role(auth.uid(),'admin'::app_role) OR EXISTS (SELECT 1 FROM public.emergencies e WHERE e.id = emergency_id AND e.user_id = auth.uid())
  )
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_fund;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_fund_transactions;

-- RPCs
CREATE OR REPLACE FUNCTION public.contribute_to_fund(_amount numeric)
RETURNS TABLE(new_wallet_balance numeric, new_fund_balance numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _w public.wallets%ROWTYPE;
  _fb numeric;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Montant invalide'; END IF;
  SELECT * INTO _w FROM public.wallets WHERE user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Portefeuille introuvable'; END IF;
  IF _w.balance < _amount THEN RAISE EXCEPTION 'Solde insuffisant'; END IF;

  UPDATE public.wallets SET balance = balance - _amount, updated_at = now()
    WHERE id = _w.id RETURNING balance INTO new_wallet_balance;
  UPDATE public.community_fund SET balance = balance + _amount, updated_at = now()
    RETURNING balance INTO _fb;
  new_fund_balance := _fb;

  INSERT INTO public.wallet_transactions(user_id, type, amount, status, notes)
  VALUES(_uid, 'achat'::transaction_type, _amount, 'approved'::transaction_status, 'Contribution au fonds communautaire');

  INSERT INTO public.community_fund_transactions(type, amount, user_id)
  VALUES('contribution', _amount, _uid);

  RETURN NEXT;
END; $$;

CREATE OR REPLACE FUNCTION public.withdraw_from_fund(_amount numeric, _reason text, _emergency_id uuid DEFAULT NULL)
RETURNS TABLE(new_fund_balance numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _fb numeric;
BEGIN
  IF _uid IS NULL OR NOT has_role(_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Réservé aux administrateurs';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Montant invalide'; END IF;
  IF _reason IS NULL OR length(trim(_reason)) < 3 THEN RAISE EXCEPTION 'Motif requis'; END IF;

  SELECT balance INTO _fb FROM public.community_fund FOR UPDATE LIMIT 1;
  IF _fb < _amount THEN RAISE EXCEPTION 'Fonds insuffisants'; END IF;

  UPDATE public.community_fund SET balance = balance - _amount, updated_at = now()
    RETURNING balance INTO new_fund_balance;

  INSERT INTO public.community_fund_transactions(type, amount, admin_id, reason, emergency_id)
  VALUES('withdrawal', _amount, _uid, _reason, _emergency_id);

  RETURN NEXT;
END; $$;

-- Public listing of emergencies with contributor names (admin view)
CREATE OR REPLACE FUNCTION public.list_emergencies_for_admin()
RETURNS TABLE(id uuid, user_id uuid, first_name text, last_name text, referral_code text,
  title text, description text, frequency emergency_frequency, amount_requested numeric,
  status emergency_status, admin_note text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.id, e.user_id, p.first_name, p.last_name, p.referral_code,
         e.title, e.description, e.frequency, e.amount_requested,
         e.status, e.admin_note, e.created_at
  FROM public.emergencies e
  LEFT JOIN public.profiles p ON p.id = e.user_id
  WHERE has_role(auth.uid(),'admin'::app_role)
  ORDER BY e.created_at DESC;
$$;