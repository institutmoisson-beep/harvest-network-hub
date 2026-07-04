
REVOKE SELECT ON public.companies FROM anon;
GRANT SELECT (
  id, name, sector, country, description,
  logo_url, banner_url, image_url_2,
  website_url, contact_facebook,
  is_active, created_at, updated_at
) ON public.companies TO anon;

DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
CREATE POLICY "Anyone can read active products" ON public.products
  FOR SELECT
  USING (is_active = true);
