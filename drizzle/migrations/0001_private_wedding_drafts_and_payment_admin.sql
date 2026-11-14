ALTER TABLE public.items ADD COLUMN archived boolean NOT NULL DEFAULT false;

DROP POLICY "Items of published weddings are public" ON public.items;
CREATE POLICY "Items of published weddings are public" ON public.items FOR SELECT TO anon, authenticated
  USING (NOT archived AND EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.published));

CREATE TABLE public.wedding_drafts (
  wedding_id uuid PRIMARY KEY REFERENCES public.weddings(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_drafts TO authenticated;
GRANT ALL ON public.wedding_drafts TO service_role;
ALTER TABLE public.wedding_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage wedding drafts" ON public.wedding_drafts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.owner_id = auth.uid()));

ALTER TABLE public.contributions
  ADD COLUMN reviewed_by uuid,
  ADD COLUMN reviewed_at timestamptz,
  ADD COLUMN review_note text NOT NULL DEFAULT '';

CREATE TABLE public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id uuid NOT NULL REFERENCES public.contributions(id) ON DELETE CASCADE,
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0),
  reason text NOT NULL,
  provider_refund_id text UNIQUE,
  status text NOT NULL DEFAULT 'initiating' CHECK (status IN ('initiating','pending','processed','failed')),
  applied_amount integer NOT NULL DEFAULT 0,
  requested_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read refunds" ON public.refunds FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.owner_id = auth.uid()));
CREATE INDEX refunds_contribution_id_idx ON public.refunds(contribution_id);

CREATE OR REPLACE FUNCTION public.publish_wedding_draft(_wedding_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _payload jsonb;
  _details jsonb;
  _item jsonb;
  _item_id uuid;
  _names text;
  _target bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.weddings WHERE id = _wedding_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'You can only publish your own wedding page.';
  END IF;
  SELECT payload INTO _payload FROM public.wedding_drafts WHERE wedding_id = _wedding_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Save a draft before publishing.'; END IF;
  _details := _payload->'details';
  _names := trim(coalesce(_details->>'names', ''));
  IF char_length(_names) < 1 OR char_length(_names) > 200 THEN RAISE EXCEPTION 'Enter couple names up to 200 characters.'; END IF;
  IF jsonb_typeof(_payload->'items') <> 'array' OR jsonb_array_length(_payload->'items') > 100 THEN
    RAISE EXCEPTION 'A wedding page can have at most 100 dreams and gifts.';
  END IF;

  FOR _item IN SELECT value FROM jsonb_array_elements(_payload->'items') LOOP
    _item_id := (_item->>'id')::uuid;
    IF _item_id IS NULL THEN RAISE EXCEPTION 'Every draft item needs an id.'; END IF;
    IF coalesce(_item->>'kind', '') NOT IN ('dream', 'gift') THEN RAISE EXCEPTION 'Invalid item kind.'; END IF;
    IF char_length(trim(coalesce(_item->>'title', ''))) < 1 OR char_length(coalesce(_item->>'title', '')) > 200 THEN
      RAISE EXCEPTION 'Every dream or gift needs a title up to 200 characters.';
    END IF;
    _target := (_item->>'target')::bigint;
    IF _target < 1 OR _target > 2147483647 THEN RAISE EXCEPTION 'Every dream or gift needs a valid target.'; END IF;

    INSERT INTO public.items (id, wedding_id, kind, title, category, description, image_url, target, archived)
    VALUES (_item_id, _wedding_id, _item->>'kind', trim(_item->>'title'), coalesce(_item->>'category', ''), coalesce(_item->>'description', ''), coalesce(_item->>'image_url', ''), _target, false)
    ON CONFLICT (id) DO UPDATE SET
      kind = EXCLUDED.kind, title = EXCLUDED.title, category = EXCLUDED.category,
      description = EXCLUDED.description, image_url = EXCLUDED.image_url,
      target = EXCLUDED.target, archived = false
    WHERE items.wedding_id = _wedding_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'A draft item belongs to another wedding.'; END IF;
  END LOOP;

  UPDATE public.items SET archived = true
  WHERE wedding_id = _wedding_id AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(_payload->'items') AS draft_item
    WHERE (draft_item->>'id')::uuid = items.id
  );

  UPDATE public.weddings SET
    names = _names,
    wedding_date = coalesce(_details->>'wedding_date', ''),
    place = coalesce(_details->>'place', ''),
    story = coalesce(_details->>'story', ''),
    cover_url = coalesce(_details->>'cover_url', ''),
    published = coalesce((_details->>'published')::boolean, false)
  WHERE id = _wedding_id;
END $$;
REVOKE ALL ON FUNCTION public.publish_wedding_draft(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_wedding_draft(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.approve_contribution(_contribution_id uuid, _payment_id text, _reviewer_id uuid, _note text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.contributions;
BEGIN
  SELECT * INTO c FROM public.contributions WHERE id = _contribution_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contribution not found.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.weddings WHERE id = c.wedding_id AND owner_id = _reviewer_id) THEN
    RAISE EXCEPTION 'You can only review payments for your own wedding.';
  END IF;
  IF c.status = 'paid' AND c.provider_payment_id = _payment_id THEN RETURN c.id; END IF;
  IF c.status <> 'pending' THEN RAISE EXCEPTION 'Only a pending contribution can be approved.'; END IF;
  UPDATE public.contributions SET
    status = 'paid', provider_payment_id = _payment_id, paid_at = now(),
    reviewed_by = _reviewer_id, reviewed_at = now(), review_note = _note
  WHERE id = c.id;
  UPDATE public.items SET raised = raised + c.amount, contributors = contributors + 1 WHERE id = c.item_id;
  RETURN c.id;
END $$;
REVOKE ALL ON FUNCTION public.approve_contribution(uuid, text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_contribution(uuid, text, uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.begin_refund(_contribution_id uuid, _amount integer, _reason text, _requested_by uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.contributions;
  _used bigint;
  _refund_id uuid;
BEGIN
  SELECT * INTO c FROM public.contributions WHERE id = _contribution_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contribution not found.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.weddings WHERE id = c.wedding_id AND owner_id = _requested_by) THEN
    RAISE EXCEPTION 'You can only refund payments for your own wedding.';
  END IF;
  IF c.status <> 'paid' OR c.provider_payment_id IS NULL THEN RAISE EXCEPTION 'Only a confirmed payment can be refunded.'; END IF;
  IF _amount < 1 THEN RAISE EXCEPTION 'Refund amount must be positive.'; END IF;
  IF char_length(trim(_reason)) < 5 OR char_length(_reason) > 500 THEN RAISE EXCEPTION 'Add a refund reason between 5 and 500 characters.'; END IF;
  IF EXISTS (SELECT 1 FROM public.refunds WHERE contribution_id = c.id AND status = 'initiating') THEN
    RAISE EXCEPTION 'Check the existing refund before starting another.';
  END IF;
  SELECT coalesce(sum(amount), 0) INTO _used FROM public.refunds
  WHERE contribution_id = c.id AND status IN ('initiating', 'pending', 'processed');
  IF _amount > c.amount - _used THEN RAISE EXCEPTION 'Refund amount exceeds the remaining contribution.'; END IF;
  INSERT INTO public.refunds (contribution_id, wedding_id, amount, reason, requested_by)
  VALUES (c.id, c.wedding_id, _amount, trim(_reason), _requested_by) RETURNING id INTO _refund_id;
  RETURN _refund_id;
END $$;
REVOKE ALL ON FUNCTION public.begin_refund(uuid, integer, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.begin_refund(uuid, integer, text, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.finish_refund(_refund_id uuid, _provider_refund_id text, _status text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.refunds;
  _item_id uuid;
  _new_applied integer;
BEGIN
  SELECT * INTO r FROM public.refunds WHERE id = _refund_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Refund not found.'; END IF;
  IF _status NOT IN ('pending', 'processed', 'failed') THEN RAISE EXCEPTION 'Invalid refund status.'; END IF;
  SELECT item_id INTO _item_id FROM public.contributions WHERE id = r.contribution_id;
  _new_applied := CASE WHEN _status IN ('pending', 'processed') THEN r.amount ELSE 0 END;
  UPDATE public.refunds SET
    provider_refund_id = coalesce(provider_refund_id, _provider_refund_id),
    status = _status,
    applied_amount = _new_applied,
    completed_at = CASE WHEN _status IN ('processed', 'failed') THEN now() ELSE completed_at END
  WHERE id = r.id;
  IF _new_applied <> r.applied_amount THEN
    UPDATE public.items SET raised = greatest(0, raised - (_new_applied - r.applied_amount)) WHERE id = _item_id;
  END IF;
  RETURN r.id;
END $$;
REVOKE ALL ON FUNCTION public.finish_refund(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_refund(uuid, text, text) TO service_role;