
CREATE TABLE IF NOT EXISTS public.product_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  unit_type text NOT NULL DEFAULT 'pièce',
  regular_price numeric NOT NULL DEFAULT 0,
  wholesale_price numeric NOT NULL DEFAULT 0,
  images text[] NOT NULL DEFAULT '{}',
  additional_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','under_review','approved_direct_buy','approved_community_sale','rejected')),
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_submissions TO authenticated;
GRANT ALL ON public.product_submissions TO service_role;

ALTER TABLE public.product_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own submissions"
  ON public.product_submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid()
     OR public.has_role(auth.uid(),'admin'::app_role)
     OR public.has_role(auth.uid(),'submissions_manager'::app_role));

CREATE POLICY "Users create own submissions"
  ON public.product_submissions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users edit own pending submissions"
  ON public.product_submissions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status IN ('pending','under_review'))
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff manage submissions"
  ON public.product_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role)
      OR public.has_role(auth.uid(),'submissions_manager'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role)
           OR public.has_role(auth.uid(),'submissions_manager'::app_role));

CREATE TRIGGER trg_product_submissions_touch
  BEFORE UPDATE ON public.product_submissions
  FOR EACH ROW EXECUTE FUNCTION public.trg_custom_orders_touch();

ALTER PUBLICATION supabase_realtime ADD TABLE public.product_submissions;

-- RPCs
CREATE OR REPLACE FUNCTION public.list_my_submissions()
RETURNS SETOF public.product_submissions
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.product_submissions
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_submissions(_status text DEFAULT NULL)
RETURNS TABLE(
  id uuid, user_id uuid, first_name text, last_name text, referral_code text, phone text, country text,
  title text, description text, category text, quantity integer, unit_type text,
  regular_price numeric, wholesale_price numeric, images text[], additional_info jsonb,
  status text, admin_notes text, created_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'submissions_manager'::app_role)) THEN
    RAISE EXCEPTION 'Réservé';
  END IF;
  RETURN QUERY
  SELECT s.id, s.user_id, p.first_name, p.last_name, p.referral_code, p.phone, p.country,
    s.title, s.description, s.category, s.quantity, s.unit_type,
    s.regular_price, s.wholesale_price, s.images, s.additional_info,
    s.status, s.admin_notes, s.created_at, s.updated_at
  FROM public.product_submissions s
  LEFT JOIN public.profiles p ON p.id = s.user_id
  WHERE (_status IS NULL OR s.status = _status)
  ORDER BY s.created_at DESC
  LIMIT 500;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_update_submission_status(_id uuid, _status text, _notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'submissions_manager'::app_role)) THEN
    RAISE EXCEPTION 'Réservé';
  END IF;
  IF _status NOT IN ('pending','under_review','approved_direct_buy','approved_community_sale','rejected') THEN
    RAISE EXCEPTION 'Statut invalide';
  END IF;
  IF _status = 'rejected' AND (_notes IS NULL OR length(trim(_notes)) = 0) THEN
    RAISE EXCEPTION 'Motif de refus requis';
  END IF;
  UPDATE public.product_submissions
     SET status = _status,
         admin_notes = COALESCE(_notes, admin_notes),
         reviewed_by = auth.uid(),
         reviewed_at = now()
   WHERE id = _id;
END; $$;

-- Storage policies
CREATE POLICY "Users upload own submission files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-submissions' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own submission files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-submissions'
     AND ((storage.foldername(name))[1] = auth.uid()::text
       OR public.has_role(auth.uid(),'admin'::app_role)
       OR public.has_role(auth.uid(),'submissions_manager'::app_role)));

CREATE POLICY "Users delete own submission files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-submissions' AND (storage.foldername(name))[1] = auth.uid()::text);
