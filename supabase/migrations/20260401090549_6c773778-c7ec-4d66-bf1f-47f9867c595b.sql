
CREATE TABLE public.pack_commission_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  level integer NOT NULL,
  percentage numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id, level)
);

ALTER TABLE public.pack_commission_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pack commission rates" ON public.pack_commission_rates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read pack commission rates" ON public.pack_commission_rates FOR SELECT TO authenticated USING (true);
