ALTER FUNCTION public.set_delivery_updated_at() SET search_path = public;

DROP POLICY IF EXISTS "Anyone can read fund" ON public.community_fund;
CREATE POLICY "Authenticated users can read fund"
ON public.community_fund FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.community_fund FROM anon;

DROP POLICY IF EXISTS "Technicians can view devices linked to their claims" ON public.devices;
CREATE POLICY "Technicians can view devices linked to their claims"
ON public.devices FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'technician'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.warranty_claims wc
    WHERE wc.device_id = devices.id
      AND wc.technician_id = auth.uid()
  )
);