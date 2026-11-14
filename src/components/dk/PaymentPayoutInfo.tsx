import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPaymentSetup } from "@/lib/payments.functions";

export function PaymentPayoutInfo() {
  const getSetup = useServerFn(getPaymentSetup);
  const setupQuery = useQuery({ queryKey: ["payment-setup"], queryFn: () => getSetup(), staleTime: 60_000 });
  const setup = setupQuery.data;

  return (
    <section aria-labelledby="payout-heading" className="rounded-2xl border border-gold/30 bg-card p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2"><Landmark className="h-5 w-5 text-gold" /><p className="eyebrow">How you get paid</p></div>
          <h2 id="payout-heading" className="mt-2 text-3xl">Guest payments settle through Razorpay</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Guests pay into DreamKnot’s single connected Razorpay account. Razorpay settles eligible live payments to that merchant account’s linked bank—not automatically to each couple. Couple bank payout requests can be saved, but transfers are not connected yet.</p>
        </div>
        <Button asChild variant="outline" className="rounded-full"><a href="https://dashboard.razorpay.com/" target="_blank" rel="noreferrer">Open Razorpay<ExternalLink className="h-4 w-4" /></a></Button>
      </div>
      <div className="mt-5 rounded-xl bg-background px-4 py-3 text-sm">
        {setupQuery.isLoading ? <span className="text-muted-foreground">Checking payment mode…</span> : setupQuery.isError ? <span className="text-destructive">Payment mode could not be checked.</span> : !setup?.configured ? <span className="font-medium text-destructive">Payments are not configured.</span> : setup.live ? <span><span className="font-medium">Live mode.</span> Real payments and settlements are handled by Razorpay.</span> : <span><span className="font-medium">Test mode.</span> No real money or bank payout will be made until live Razorpay keys are configured.</span>}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">All contributions use the single Razorpay account configured for DreamKnot; separate bank onboarding for each couple is not currently available. “Net received” is a contribution total after recorded refunds, not your available bank balance. Check Razorpay for KYC approval, bank details, fees, and settlement status.</p>
    </section>
  );
}
