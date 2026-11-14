import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/lib/demo';
import { payoutNet, settlementDate } from '@/lib/payouts';

export function usePayoutHistory(weddingId?: string) {
  return useQuery({
    queryKey: ['payout-history', weddingId ?? 'all'],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('Please sign in');
      let weddingsQuery = supabase.from('weddings').select('id,names').eq('owner_id', auth.user.id);
      if (weddingId) weddingsQuery = weddingsQuery.eq('id', weddingId);
      const weddings = await weddingsQuery;
      if (weddings.error) throw weddings.error;
      const ids = (weddings.data ?? []).map(w => w.id);
      if (!ids.length) return [];
      const [payments, requests] = await Promise.all([
        supabase.from('contributions').select('id,wedding_id,amount,paid_at,guest_name,items(title),refunds(amount,status)').in('wedding_id', ids).eq('status', 'paid').order('paid_at', { ascending: false }),
        supabase.from('payout_requests').select('id,contribution_id,amount,status,payment_mode,bank_last4,bank_name,created_at,settled_at,transfer_reference,review_note').in('wedding_id', ids).order('created_at', { ascending: false }),
      ]);
      if (payments.error) throw payments.error;
      if (requests.error) throw requests.error;
      return (payments.data ?? []).map(p => ({ ...p, net: payoutNet(p.amount, p.refunds ?? []), weddingName: weddings.data?.find(w => w.id === p.wedding_id)?.names ?? 'Wedding', requests: (requests.data ?? []).filter(r => r.contribution_id === p.id) }));
    },
    refetchInterval: 30_000,
  });
}

const date = (value: string) => new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export function PayoutHistory({ weddingId }: { weddingId?: string }) {
  const query = usePayoutHistory(weddingId);
  return <section className="border-t border-border py-8" aria-labelledby="payout-history-heading">
    <p className="eyebrow">Paid gifts & bank payouts</p><h2 id="payout-history-heading" className="mt-2 text-3xl">Payout history</h2>
    <p className="mt-3 text-sm text-muted-foreground">A confirmed gift is not a bank payout. Couple transfers are not connected; settlement dates remain unavailable until a transfer is verified.</p>
    {query.isPending ? <p className="mt-6 text-muted-foreground">Loading payout history…</p> : query.isError ? <div className="mt-6"><p className="text-destructive">Payout history could not be loaded.</p><Button variant="outline" onClick={() => query.refetch()}>Try again</Button></div> : query.data.length === 0 ? <p className="mt-6 text-muted-foreground">No confirmed gift payments yet.</p> : <div className="mt-6 divide-y divide-border">
      {query.data.map(payment => {
        const request = payment.requests[0];
        const active = payment.requests.some(r => ['requested', 'processing', 'settled'].includes(r.status));
        const settled = settlementDate(request);
        return <article key={payment.id} className="py-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl">{payment.items?.title ?? 'Gift'}</h3><p className="text-sm text-muted-foreground">{payment.weddingName} · {payment.guest_name}</p></div><p className="font-medium">{formatINR(payment.amount)}</p></div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-muted-foreground">Payment confirmed</dt><dd>{payment.paid_at ? date(payment.paid_at) : 'Date unavailable'}</dd></div><div><dt className="text-muted-foreground">After recorded refunds</dt><dd>{formatINR(payment.net)}</dd></div><div><dt className="text-muted-foreground">Settled into couple account</dt><dd>{settled ? date(settled) : 'Not verified · date unavailable'}</dd></div></dl>
          {payment.requests.map(r => <div key={r.id} className="mt-4 text-sm"><p className="capitalize">{r.payment_mode === 'test' ? 'Test request' : 'Payout request'} · {r.status} · {formatINR(r.amount)}</p><p className="break-words text-muted-foreground">{date(r.created_at)} · {r.bank_name} ending {r.bank_last4}{r.transfer_reference ? ` · ${r.transfer_reference}` : ''}</p>{r.review_note && <p>{r.review_note}</p>}</div>)}
          {!active && payment.net > 0 && <Button asChild variant="outline" size="sm" className="mt-4"><Link to="/payouts/$weddingId" params={{ weddingId: payment.wedding_id }}>Request bank payout</Link></Button>}
        </article>;
      })}
    </div>}
  </section>;
}