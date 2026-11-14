import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { approvePendingPayment, refundContribution, refreshRefund } from "@/lib/payment-admin.functions";
import { remainingRefundable } from "@/lib/payment-admin";
import { formatINR } from "@/lib/demo";

export type AdminContribution = {
  id: string;
  guest_name: string;
  amount: number;
  message: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  provider_payment_id: string | null;
  review_note: string;
  reviewed_at: string | null;
  itemTitle: string;
};

export type AdminRefund = {
  id: string;
  contribution_id: string;
  amount: number;
  reason: string;
  provider_refund_id: string | null;
  status: string;
  created_at: string;
};

type Props = { contributions: AdminContribution[]; refunds: AdminRefund[]; onChanged: () => void };

export function PaymentAdmin({ contributions, refunds, onChanged }: Props) {
  const approve = useServerFn(approvePendingPayment);
  const refund = useServerFn(refundContribution);
  const refresh = useServerFn(refreshRefund);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [refundId, setRefundId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState("");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const review = contributions.find((contribution) => contribution.id === reviewId);
  const refundTarget = contributions.find((contribution) => contribution.id === refundId);
  const targetRefunds = refunds.filter((item) => item.contribution_id === refundId);
  const remaining = refundTarget ? remainingRefundable(refundTarget.amount, targetRefunds) : 0;

  function openReview(contribution: AdminContribution) {
    setReviewId(contribution.id);
    setPaymentId(contribution.provider_payment_id ?? "");
    setNote("");
  }
  function openRefund(contribution: AdminContribution) {
    setRefundId(contribution.id);
    setAmount(remainingRefundable(contribution.amount, refunds.filter((item) => item.contribution_id === contribution.id)));
    setReason("");
  }
  async function submitReview() {
    if (!review) return;
    setBusy(true);
    try {
      await approve({ data: { contributionId: review.id, paymentId, note } });
      toast.success("Payment confirmed and added to the gift total");
      setReviewId(null); onChanged();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Payment could not be approved"); }
    finally { setBusy(false); }
  }
  async function submitRefund() {
    if (!refundTarget) return;
    setBusy(true);
    try {
      await refund({ data: { contributionId: refundTarget.id, amount, reason } });
      toast.success("Refund sent to Razorpay for the original payment method");
      setRefundId(null); onChanged();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Refund could not be started"); onChanged(); }
    finally { setBusy(false); }
  }
  async function checkStatus(id: string) {
    setRefreshing(id);
    try {
      const result = await refresh({ data: { refundId: id } });
      toast.success(result.found ? `Refund status: ${result.status}` : "Razorpay has no update yet");
      onChanged();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Status could not be refreshed"); }
    finally { setRefreshing(null); }
  }

  return (
    <div className="rounded-2xl bg-card p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Payment admin</p>
          <h2 className="mt-1 text-3xl">Contributions & refunds</h2>
        </div>
        <Button asChild variant="link" className="px-0"><a href="/refund-policy" target="_blank" rel="noreferrer">Refund policy</a></Button>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">Approve a pending contribution only after Razorpay verifies that its payment was captured. Approved refunds are reviewed by you, recorded with a reason, and returned to the guest’s original payment method.</p>
      {contributions.length === 0 ? <p className="mt-5 text-muted-foreground">No contributions yet.</p> : (
        <ul className="mt-6 divide-y divide-border">
          {contributions.map((contribution) => {
            const contributionRefunds = refunds.filter((item) => item.contribution_id === contribution.id);
            const left = remainingRefundable(contribution.amount, contributionRefunds);
            return (
              <li key={contribution.id} className="space-y-4 py-5 text-sm first:pt-0 last:pb-0">
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div className="min-w-0">
                    <p className="font-medium">{contribution.guest_name} · {contribution.itemTitle}</p>
                    {contribution.message && <p className="mt-1 text-muted-foreground">“{contribution.message}”</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={contribution.status} />
                      {contribution.paid_at && <span className="text-xs text-muted-foreground">{new Date(contribution.paid_at).toLocaleString("en-IN")}</span>}
                    </div>
                    {contribution.provider_payment_id && <p className="mt-2 break-all text-xs text-muted-foreground">Payment ref. {contribution.provider_payment_id}</p>}
                    {contribution.reviewed_at && <p className="mt-2 text-xs text-muted-foreground">Manually reviewed: {contribution.review_note}</p>}
                  </div>
                  <div className="shrink-0 sm:text-right">
                    <p className="font-serif text-2xl">{formatINR(contribution.amount)}</p>
                    <div className="mt-3 flex gap-2 sm:justify-end">
                      {contribution.status === "pending" && <Button type="button" size="sm" variant="outline" onClick={() => openReview(contribution)}>Review payment</Button>}
                      {contribution.status === "paid" && contribution.provider_payment_id && left > 0 && <Button type="button" size="sm" variant="outline" onClick={() => openRefund(contribution)}>Refund</Button>}
                    </div>
                  </div>
                </div>
                {contributionRefunds.length > 0 && <div className="space-y-2 rounded-xl bg-background p-4">
                  <p className="eyebrow">Refund history · {formatINR(contribution.amount - left)} committed</p>
                  {contributionRefunds.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div><span className="font-medium">{formatINR(item.amount)} · {item.status}</span><p className="mt-1 text-muted-foreground">{item.reason}</p>{item.provider_refund_id && <p className="mt-1 break-all text-muted-foreground">{item.provider_refund_id}</p>}</div>
                    {(item.status === "initiating" || item.status === "pending") && <Button type="button" size="sm" variant="ghost" disabled={refreshing === item.id} onClick={() => checkStatus(item.id)}><RefreshCw className={refreshing === item.id ? "animate-spin" : ""} />Check status</Button>}
                  </div>)}
                </div>}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!review} onOpenChange={(open) => { if (!open && !busy) setReviewId(null); }}>
        <DialogContent className="bg-background">
          <DialogHeader><DialogTitle className="font-serif text-3xl">Review pending payment</DialogTitle><DialogDescription>Razorpay must confirm a captured payment for {review ? formatINR(review.amount) : "this contribution"} before it becomes a completed gift.</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label htmlFor="payment-reference">Razorpay payment reference</Label><Input id="payment-reference" value={paymentId} onChange={(event) => setPaymentId(event.target.value)} placeholder="pay_…" /></div>
          <div className="space-y-2"><Label htmlFor="review-note">Review note</Label><Textarea id="review-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Checked the guest’s bank debit and Razorpay payment details" /></div>
          <Button type="button" disabled={busy || !paymentId.trim() || note.trim().length < 5} onClick={submitReview}>{busy ? "Verifying with Razorpay…" : "Verify & approve payment"}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!refundTarget} onOpenChange={(open) => { if (!open && !busy) setRefundId(null); }}>
        <DialogContent className="bg-background">
          <DialogHeader><DialogTitle className="font-serif text-3xl">Approve a refund</DialogTitle><DialogDescription>This follows your refund review policy. Razorpay returns the money to the original payment method; its arrival time depends on the provider and bank.</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label htmlFor="refund-amount">Refund amount (₹)</Label><Input id="refund-amount" type="number" min={1} max={remaining} value={amount || ""} onChange={(event) => setAmount(Number(event.target.value))} /><p className="text-xs text-muted-foreground">Up to {formatINR(remaining)} remaining on this contribution.</p></div>
          <div className="space-y-2"><Label htmlFor="refund-reason">Approval reason</Label><Textarea id="refund-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Duplicate payment confirmed with the guest" /></div>
          <p className="text-xs leading-relaxed text-muted-foreground">This action contacts Razorpay immediately. Do not start a second refund while the first is awaiting a status check.</p>
          <Button type="button" disabled={busy || amount < 1 || amount > remaining || reason.trim().length < 5} onClick={submitRefund}>{busy ? "Contacting Razorpay…" : `Approve ${amount ? formatINR(amount) : ""} refund`}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = status === "paid" ? "Confirmed" : status === "failed" ? "Failed" : "Pending";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status === "paid" ? "bg-gold/15 text-foreground" : "bg-muted text-muted-foreground"}`}>{label}</span>;
}
