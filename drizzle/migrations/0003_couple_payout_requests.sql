CREATE TABLE public.payout_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
 contribution_id uuid NOT NULL REFERENCES public.contributions(id),
 owner_id uuid NOT NULL,
 amount integer NOT NULL CHECK (amount > 0),
 status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','processing','settled','rejected','cancelled')),
 payment_mode text NOT NULL CHECK (payment_mode IN ('test','live')),
 bank_ciphertext text NOT NULL,
 bank_last4 text NOT NULL CHECK (bank_last4 ~ '^[0-9]{4}$'),
 bank_name text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 settled_at timestamptz,
 transfer_reference text,
 review_note text,
 CHECK (status <> 'settled' OR (settled_at IS NOT NULL AND transfer_reference IS NOT NULL AND payment_mode = 'live'))
);
GRANT SELECT (id,wedding_id,contribution_id,owner_id,amount,status,payment_mode,bank_last4,bank_name,created_at,settled_at,transfer_reference,review_note) ON public.payout_requests TO authenticated;
GRANT ALL ON public.payout_requests TO service_role;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read payout requests" ON public.payout_requests FOR SELECT TO authenticated USING (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.weddings w WHERE w.id = wedding_id AND w.owner_id = auth.uid()));
CREATE UNIQUE INDEX payout_requests_active_contribution ON public.payout_requests(contribution_id) WHERE status IN ('requested','processing','settled');
CREATE OR REPLACE FUNCTION public.submit_couple_payout(_owner uuid, _contribution uuid, _ciphertext text, _last4 text, _bank_name text, _mode text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.contributions; net_amount integer; request_id uuid;
BEGIN
 SELECT * INTO c FROM public.contributions WHERE id = _contribution FOR UPDATE;
 IF c.id IS NULL OR NOT EXISTS (SELECT 1 FROM public.weddings WHERE id = c.wedding_id AND owner_id = _owner) THEN RAISE EXCEPTION 'Wedding not found or access denied'; END IF;
 IF c.status <> 'paid' THEN RAISE EXCEPTION 'Only confirmed payments can be requested'; END IF;
 IF EXISTS (SELECT 1 FROM public.payout_requests WHERE contribution_id = c.id AND status IN ('requested','processing','settled')) THEN RAISE EXCEPTION 'A payout has already been requested for this payment'; END IF;
 SELECT c.amount - COALESCE(SUM(amount),0) INTO net_amount FROM public.refunds WHERE contribution_id = c.id AND status IN ('initiating','pending','processed');
 IF net_amount <= 0 THEN RAISE EXCEPTION 'No unrefunded amount is available'; END IF;
 INSERT INTO public.payout_requests(wedding_id,contribution_id,owner_id,amount,bank_ciphertext,bank_last4,bank_name,payment_mode) VALUES(c.wedding_id,c.id,_owner,net_amount,_ciphertext,_last4,_bank_name,_mode) RETURNING id INTO request_id;
 RETURN request_id;
END $$;
REVOKE ALL ON FUNCTION public.submit_couple_payout(uuid,uuid,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_couple_payout(uuid,uuid,text,text,text,text) TO service_role;
COMMENT ON TABLE public.payout_requests IS 'Owner payout requests, not bank transfers. Bank data is AES-GCM encrypted. Settlement fields require independent verified bank transfer evidence; no automatic execution is implemented.';