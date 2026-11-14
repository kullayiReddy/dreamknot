CREATE TABLE public.couple_profiles (
  wedding_id UUID PRIMARY KEY REFERENCES public.weddings(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  instagram_url TEXT NOT NULL DEFAULT '',
  facebook_url TEXT NOT NULL DEFAULT '',
  website_url TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.couple_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couple_profiles TO authenticated;
GRANT ALL ON public.couple_profiles TO service_role;
ALTER TABLE public.couple_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles of published weddings are public"
ON public.couple_profiles FOR SELECT
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.weddings w
  WHERE w.id = couple_profiles.wedding_id AND w.published
));
CREATE POLICY "Owners manage couple profiles"
ON public.couple_profiles FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.weddings w
  WHERE w.id = couple_profiles.wedding_id AND w.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.weddings w
  WHERE w.id = couple_profiles.wedding_id AND w.owner_id = auth.uid()
));