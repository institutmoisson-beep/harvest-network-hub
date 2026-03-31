
-- Sectors table for product/pack categorization
CREATE TABLE public.sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sectors" ON public.sectors FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage sectors" ON public.sectors FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Add sector field to products
ALTER TABLE public.products ADD COLUMN sector text DEFAULT '';

-- Add is_pro_visible to profiles for Moissonneurs Pros directory
ALTER TABLE public.profiles ADD COLUMN is_pro_visible boolean NOT NULL DEFAULT false;
