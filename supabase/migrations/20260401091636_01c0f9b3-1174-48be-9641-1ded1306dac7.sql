
INSERT INTO storage.buckets (id, name, public) VALUES ('company-images', 'company-images', true);

CREATE POLICY "Anyone can read company images" ON storage.objects FOR SELECT USING (bucket_id = 'company-images');
CREATE POLICY "Admins can upload company images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'company-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete company images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'company-images' AND public.has_role(auth.uid(), 'admin'));
