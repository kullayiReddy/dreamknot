CREATE TABLE public.weddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  names text NOT NULL,
  wedding_date text NOT NULL DEFAULT '',
  place text NOT NULL DEFAULT '',
  story text NOT NULL DEFAULT '',
  cover_url text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.weddings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weddings TO authenticated;
GRANT ALL ON public.weddings TO service_role;
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published weddings are public" ON public.weddings FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY "Owners read own" ON public.weddings FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners insert" ON public.weddings FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update" ON public.weddings FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete" ON public.weddings FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'dream' CHECK (kind IN ('dream','gift')),
  title text NOT NULL,
  category text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  target integer NOT NULL CHECK (target > 0),
  raised integer NOT NULL DEFAULT 0,
  contributors integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items of published weddings are public" ON public.items FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.published));
CREATE POLICY "Owners manage items" ON public.items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.owner_id = auth.uid()));

-- Owners must not edit raised/contributors directly
CREATE OR REPLACE FUNCTION public.protect_item_totals() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated','anon') THEN
    IF TG_OP = 'INSERT' THEN NEW.raised := 0; NEW.contributors := 0;
    ELSE NEW.raised := OLD.raised; NEW.contributors := OLD.contributors; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER items_protect_totals BEFORE INSERT OR UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.protect_item_totals();

CREATE TABLE public.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  guest_email text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  amount integer NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  provider_order_id text UNIQUE,
  provider_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
GRANT SELECT ON public.contributions TO authenticated;
GRANT ALL ON public.contributions TO service_role;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read contributions" ON public.contributions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.mark_contribution_paid(_order_id text, _payment_id text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.contributions;
BEGIN
  SELECT * INTO c FROM public.contributions WHERE provider_order_id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found'; END IF;
  IF c.status <> 'paid' THEN
    UPDATE public.contributions SET status = 'paid', provider_payment_id = _payment_id, paid_at = now() WHERE id = c.id;
    UPDATE public.items SET raised = raised + c.amount, contributors = contributors + 1 WHERE id = c.item_id;
  END IF;
  RETURN c.id;
END $$;
REVOKE ALL ON FUNCTION public.mark_contribution_paid(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_contribution_paid(text, text) TO service_role;