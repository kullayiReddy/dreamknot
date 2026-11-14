import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PayoutHistory, usePayoutHistory } from '@/components/dk/PayoutHistory';
import { PaymentPayoutInfo } from '@/components/dk/PaymentPayoutInfo';
import { submitPayoutRequest } from '@/lib/payouts.functions';
import { payoutInputSchema } from '@/lib/payouts';
import { formatINR } from '@/lib/demo';

export const Route = createFileRoute('/_authenticated/payouts/$weddingId')({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: 'Request a bank payout — DreamKnot' }, { name: 'description', content: 'Submit a private couple bank payout request and track its status.' }, { property: 'og:title', content: 'Request a bank payout — DreamKnot' }, { property: 'og:description', content: 'Private couple payout requests and settlement history.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex, follow' }] }),
  component: PayoutPage,
});

function PayoutPage() {
  const { weddingId } = Route.useParams();
  const query = usePayoutHistory(weddingId);
  const qc = useQueryClient();
  const submit = useServerFn(submitPayoutRequest);
  const [form, setForm] = useState({ contributionId: '', accountName: '', bankName: '', accountNumber: '', confirmAccountNumber: '', ifsc: '' });
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const eligible = (query.data ?? []).filter(p => p.net > 0 && !p.requests.some(r => ['requested', 'processing', 'settled'].includes(r.status)));
  async function send(event: React.FormEvent) {
    event.preventDefault();
    const parsed = payoutInputSchema.safeParse({ ...form, acknowledged });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? 'Check your bank details'); return; }
    setBusy(true);
    try {
      await submit({ data: parsed.data });
      setForm({ contributionId: '', accountName: '', bankName: '', accountNumber: '', confirmAccountNumber: '', ifsc: '' });
      setAcknowledged(false); setSuccess(true);
      await qc.invalidateQueries({ queryKey: ['payout-history'] });
      toast.success('Payout request saved — no bank transfer initiated');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Request could not be saved'); }
    finally { setBusy(false); }
  }
  return <section className="mx-auto max-w-4xl space-y-8 px-6 py-12">
    <Button asChild variant="ghost"><Link to="/manage/$weddingId" params={{ weddingId }}>← Couple admin</Link></Button>
    <div><p className="eyebrow">Couple payouts</p><h1 className="mt-2 text-4xl">Request a bank payout</h1><p className="mt-4 text-sm text-muted-foreground">Requests are saved for review only. DreamKnot cannot yet transfer funds to your bank. There is no guaranteed settlement date, and test payments cannot be paid out.</p></div>
    <PaymentPayoutInfo />
    {success && <p role="status" className="border-l-2 border-gold pl-4">Request saved. No money has moved; bank transfer arrangements and verification are still required.</p>}
    {query.isPending ? <p>Loading confirmed gifts…</p> : query.isError ? <p className="text-destructive">Unable to load eligible payments. Please retry from payout history below.</p> : eligible.length === 0 ? <p className="text-muted-foreground">No eligible payments. Gifts must have a confirmed payment, an unrefunded amount, and no active payout request.</p> : <form onSubmit={send} className="space-y-5 border-t border-border pt-6">
      <div className="space-y-2"><Label htmlFor="payout-gift">Paid gift</Label><select id="payout-gift" required value={form.contributionId} onChange={e => setForm({ ...form, contributionId: e.target.value })} className="w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Select a payment</option>{eligible.map(p => <option key={p.id} value={p.id}>{p.items?.title ?? 'Gift'} · {p.guest_name} · {formatINR(p.net)}</option>)}</select></div>
      <div className="grid gap-5 sm:grid-cols-2">{([
        ['accountName', 'Account holder name'], ['bankName', 'Bank name'], ['accountNumber', 'Bank account number'], ['confirmAccountNumber', 'Confirm bank account number'], ['ifsc', 'IFSC code'],
      ] as const).map(([key, label]) => <div key={key} className="space-y-2"><Label htmlFor={`payout-${key}`}>{label}</Label><Input id={`payout-${key}`} required autoComplete="off" type={key.includes('AccountNumber') || key === 'accountNumber' ? 'password' : 'text'} inputMode={key.includes('AccountNumber') || key === 'accountNumber' ? 'numeric' : 'text'} maxLength={key === 'ifsc' ? 11 : key.includes('AccountNumber') || key === 'accountNumber' ? 18 : 100} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></div>)}</div>
      <p className="text-xs text-muted-foreground">Bank details are encrypted and kept private. Saved history shows only your bank name and the final four account digits.</p>
      <div className="flex items-start gap-3"><Checkbox id="payout-acknowledge" checked={acknowledged} onCheckedChange={value => setAcknowledged(value === true)} /><Label htmlFor="payout-acknowledge" className="text-sm leading-relaxed">I understand this saves a request only, not a bank transfer. Test-mode requests do not move real money.</Label></div>
      <Button type="submit" disabled={busy || !acknowledged}>{busy ? 'Submitting…' : 'Submit payout request'}</Button>
    </form>}
    <PayoutHistory weddingId={weddingId} />
  </section>;
}