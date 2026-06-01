
-- Profile contract signature
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contract_signed_at timestamptz;

-- BROADCAST CHANNEL
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  target_user_id uuid,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  image_url text,
  link_url text,
  link_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.broadcast_messages TO authenticated;
GRANT ALL ON public.broadcast_messages TO service_role;
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage broadcasts" ON public.broadcast_messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Users read their broadcasts" ON public.broadcast_messages
  FOR SELECT TO authenticated
  USING (target_user_id IS NULL OR target_user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.broadcast_reads (
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
GRANT SELECT, INSERT ON public.broadcast_reads TO authenticated;
GRANT ALL ON public.broadcast_reads TO service_role;
ALTER TABLE public.broadcast_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reads" ON public.broadcast_reads
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_messages;

-- CAREER GRADES
CREATE TABLE IF NOT EXISTS public.career_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  min_revenue numeric NOT NULL DEFAULT 0,
  min_active_referrals integer NOT NULL DEFAULT 0,
  min_downline_size integer NOT NULL DEFAULT 0,
  weekly_bonus numeric NOT NULL DEFAULT 0,
  monthly_bonus numeric NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.career_grades TO authenticated;
GRANT ALL ON public.career_grades TO service_role;
ALTER TABLE public.career_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active grades" ON public.career_grades
  FOR SELECT TO authenticated USING (is_active OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role));
CREATE POLICY "Admin and career manage" ON public.career_grades
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role));

CREATE TABLE IF NOT EXISTS public.user_career_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  grade_id uuid REFERENCES public.career_grades(id) ON DELETE SET NULL,
  custom_weekly_bonus numeric,
  custom_monthly_bonus numeric,
  notes text,
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_career_overrides TO authenticated;
GRANT ALL ON public.user_career_overrides TO service_role;
ALTER TABLE public.user_career_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User reads own override" ON public.user_career_overrides
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role));
CREATE POLICY "Admin/career manage overrides" ON public.user_career_overrides
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role));

CREATE TABLE IF NOT EXISTS public.career_bonus_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  grade_id uuid,
  amount numeric NOT NULL,
  period text NOT NULL,
  notes text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  paid_by uuid
);
GRANT SELECT ON public.career_bonus_payouts TO authenticated;
GRANT ALL ON public.career_bonus_payouts TO service_role;
ALTER TABLE public.career_bonus_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User reads own payouts" ON public.career_bonus_payouts
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role));
CREATE POLICY "Admin/career manage payouts" ON public.career_bonus_payouts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role));

-- BROADCAST RPCs
CREATE OR REPLACE FUNCTION public.create_broadcast(_title text, _content text, _image_url text DEFAULT NULL, _link_url text DEFAULT NULL, _link_label text DEFAULT NULL, _target_user_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF NOT has_role(auth.uid(),'admin'::app_role) THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
  IF _title IS NULL OR length(trim(_title)) = 0 THEN RAISE EXCEPTION 'Titre requis'; END IF;
  INSERT INTO public.broadcast_messages(sender_id, title, content, image_url, link_url, link_label, target_user_id)
  VALUES(auth.uid(), _title, COALESCE(_content,''), _image_url, _link_url, _link_label, _target_user_id)
  RETURNING id INTO _id;
  RETURN _id;
END; $$;
REVOKE EXECUTE ON FUNCTION public.create_broadcast(text,text,text,text,text,uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_broadcast(text,text,text,text,text,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_broadcast_read(_message_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  INSERT INTO public.broadcast_reads(message_id, user_id) VALUES(_message_id, auth.uid())
  ON CONFLICT DO NOTHING;
END; $$;
REVOKE EXECUTE ON FUNCTION public.mark_broadcast_read(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.mark_broadcast_read(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.count_unread_broadcasts()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*)::int FROM public.broadcast_messages b
  WHERE (b.target_user_id IS NULL OR b.target_user_id = auth.uid())
    AND NOT EXISTS (SELECT 1 FROM public.broadcast_reads r WHERE r.message_id = b.id AND r.user_id = auth.uid());
$$;
REVOKE EXECUTE ON FUNCTION public.count_unread_broadcasts() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.count_unread_broadcasts() TO authenticated;

CREATE OR REPLACE FUNCTION public.list_my_broadcasts()
RETURNS TABLE(id uuid, title text, content text, image_url text, link_url text, link_label text, target_user_id uuid, created_at timestamptz, is_read boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.id, b.title, b.content, b.image_url, b.link_url, b.link_label, b.target_user_id, b.created_at,
         EXISTS(SELECT 1 FROM public.broadcast_reads r WHERE r.message_id = b.id AND r.user_id = auth.uid())
  FROM public.broadcast_messages b
  WHERE b.target_user_id IS NULL OR b.target_user_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role)
  ORDER BY b.created_at DESC LIMIT 200;
$$;
REVOKE EXECUTE ON FUNCTION public.list_my_broadcasts() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.list_my_broadcasts() TO authenticated;

-- CAREER RPCs
CREATE OR REPLACE FUNCTION public.admin_upsert_grade(_id uuid, _name text, _description text, _min_revenue numeric, _min_active_referrals integer, _min_downline_size integer, _weekly_bonus numeric, _monthly_bonus numeric, _display_order integer, _is_active boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _gid uuid;
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role)) THEN
    RAISE EXCEPTION 'Action réservée';
  END IF;
  IF _id IS NULL THEN
    INSERT INTO public.career_grades(name, description, min_revenue, min_active_referrals, min_downline_size, weekly_bonus, monthly_bonus, display_order, is_active)
    VALUES(_name, COALESCE(_description,''), COALESCE(_min_revenue,0), COALESCE(_min_active_referrals,0), COALESCE(_min_downline_size,0), COALESCE(_weekly_bonus,0), COALESCE(_monthly_bonus,0), COALESCE(_display_order,0), COALESCE(_is_active,true))
    RETURNING id INTO _gid;
  ELSE
    UPDATE public.career_grades SET name=_name, description=COALESCE(_description,''), min_revenue=COALESCE(_min_revenue,0),
      min_active_referrals=COALESCE(_min_active_referrals,0), min_downline_size=COALESCE(_min_downline_size,0),
      weekly_bonus=COALESCE(_weekly_bonus,0), monthly_bonus=COALESCE(_monthly_bonus,0),
      display_order=COALESCE(_display_order,0), is_active=COALESCE(_is_active,true), updated_at=now()
    WHERE id=_id RETURNING id INTO _gid;
  END IF;
  RETURN _gid;
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_grade(uuid,text,text,numeric,integer,integer,numeric,numeric,integer,boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_upsert_grade(uuid,text,text,numeric,integer,integer,numeric,numeric,integer,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_grade(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role)) THEN
    RAISE EXCEPTION 'Action réservée';
  END IF;
  DELETE FROM public.career_grades WHERE id = _id;
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_delete_grade(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_delete_grade(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_user_grade(_user_id uuid, _grade_id uuid, _weekly numeric, _monthly numeric, _notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role)) THEN
    RAISE EXCEPTION 'Action réservée';
  END IF;
  INSERT INTO public.user_career_overrides(user_id, grade_id, custom_weekly_bonus, custom_monthly_bonus, notes, assigned_by)
  VALUES(_user_id, _grade_id, _weekly, _monthly, _notes, auth.uid())
  ON CONFLICT (user_id) DO UPDATE SET grade_id=EXCLUDED.grade_id, custom_weekly_bonus=EXCLUDED.custom_weekly_bonus,
    custom_monthly_bonus=EXCLUDED.custom_monthly_bonus, notes=EXCLUDED.notes, assigned_by=auth.uid(), assigned_at=now();
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_grade(uuid,uuid,numeric,numeric,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_set_user_grade(uuid,uuid,numeric,numeric,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_pay_career_bonus(_user_id uuid, _amount numeric, _period text, _notes text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _gid uuid;
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role)) THEN
    RAISE EXCEPTION 'Action réservée';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Montant invalide'; END IF;
  SELECT grade_id INTO _gid FROM public.user_career_overrides WHERE user_id = _user_id;
  UPDATE public.wallets SET balance = balance + _amount, updated_at = now() WHERE user_id = _user_id;
  INSERT INTO public.wallet_transactions(user_id, type, amount, status, notes)
  VALUES(_user_id, 'commission'::transaction_type, _amount, 'approved'::transaction_status,
         'Bonus carrière ' || _period || COALESCE(' — ' || _notes, ''));
  INSERT INTO public.career_bonus_payouts(user_id, grade_id, amount, period, notes, paid_by)
  VALUES(_user_id, _gid, _amount, _period, _notes, auth.uid());
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_pay_career_bonus(uuid,numeric,text,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_pay_career_bonus(uuid,numeric,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_users_for_career()
RETURNS TABLE(user_id uuid, first_name text, last_name text, referral_code text, country text, total_revenue numeric, active_referrals integer, downline_size integer, grade_id uuid, grade_name text, weekly_bonus numeric, monthly_bonus numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'career_manager'::app_role)) THEN
    RAISE EXCEPTION 'Action réservée';
  END IF;
  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, p.referral_code, p.country,
    COALESCE((SELECT SUM(total_price) FROM public.orders WHERE user_id = p.id), 0)
      + COALESCE((SELECT SUM(total_price) FROM public.commerce_orders WHERE user_id = p.id), 0),
    COALESCE((SELECT COUNT(*)::int FROM public.profiles pp JOIN public.network n ON n.user_id = pp.id WHERE n.sponsor_id = p.id AND pp.is_system_active), 0),
    COALESCE((SELECT COUNT(*)::int FROM public.get_downline(p.id)), 0),
    o.grade_id, g.name,
    COALESCE(o.custom_weekly_bonus, g.weekly_bonus, 0),
    COALESCE(o.custom_monthly_bonus, g.monthly_bonus, 0)
  FROM public.profiles p
  LEFT JOIN public.user_career_overrides o ON o.user_id = p.id
  LEFT JOIN public.career_grades g ON g.id = o.grade_id
  ORDER BY p.created_at DESC LIMIT 500;
END; $$;
REVOKE EXECUTE ON FUNCTION public.list_users_for_career() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.list_users_for_career() TO authenticated;

-- Broadcast media bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('broadcast-media','broadcast-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read broadcast media" ON storage.objects;
CREATE POLICY "Public read broadcast media" ON storage.objects FOR SELECT USING (bucket_id = 'broadcast-media');
DROP POLICY IF EXISTS "Admins upload broadcast media" ON storage.objects;
CREATE POLICY "Admins upload broadcast media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'broadcast-media' AND has_role(auth.uid(),'admin'::app_role));
DROP POLICY IF EXISTS "Admins delete broadcast media" ON storage.objects;
CREATE POLICY "Admins delete broadcast media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'broadcast-media' AND has_role(auth.uid(),'admin'::app_role));
