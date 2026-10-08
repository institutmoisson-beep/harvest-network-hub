DROP POLICY IF EXISTS "Anyone can read commission rates" ON public.commission_rates;
DROP POLICY IF EXISTS "Anyone can read pack commission rates" ON public.pack_commission_rates;
DROP POLICY IF EXISTS "Public read pack images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read company images" ON storage.objects;
DROP POLICY IF EXISTS "Public read broadcast media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read care-swap media" ON storage.objects;