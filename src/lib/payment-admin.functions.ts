import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertApprovableStatus, assertRefundable, paymentReviewSchema, refundRequestSchema } from "@/lib/payment-admin";

function razorpayKeys() {
  const id = process.env["RAZORPAY_KEY_ID"];
  const secret = process.env["RAZORPAY_KEY_SECRET"];
  if (!id || !secret) throw new Error("Payments are not set up yet.");
  return { authorization: "Basic " + btoa(`${id}:${secret}`) };
}

type ProviderPayment = { id: string; order_id: string; amount: number; currency: string; status: string };
type ProviderRefund = { id: string; amount: number; status: string; notes?: Record<string, string> };

export const approvePendingPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => paymentReviewSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: contribution } = await context.supabase.from("contributions")
      .select("id, amount, status, provider_order_id, weddings!inner(owner_id)")
      .eq("id", data.contributionId).maybeSingle();
    if (!contribution || (contribution as any).weddings?.owner_id !== context.userId) throw new Error("Contribution not found.");
    assertApprovableStatus(contribution.status);

    const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(data.paymentId)}`, {
      headers: { authorization: razorpayKeys().authorization },
    });
    if (!response.ok) throw new Error("Razorpay could not find or verify this payment reference.");
    const payment = await response.json() as ProviderPayment;
    if (payment.status !== "captured") throw new Error("This payment has not been captured by Razorpay.");
    if (payment.order_id !== contribution.provider_order_id) throw new Error("This payment belongs to a different order.");
    if (payment.amount !== contribution.amount * 100 || payment.currency !== "INR") throw new Error("The payment amount or currency does not match this contribution.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("approve_contribution", {
      _contribution_id: contribution.id,
      _payment_id: payment.id,
      _reviewer_id: context.userId,
      _note: data.note,
    });
    if (error) throw new Error(error.message);
    return { contributionId: contribution.id, status: "paid" };
  });

export const refundContribution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => refundRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: contribution } = await context.supabase.from("contributions")
      .select("id, status, provider_payment_id, weddings!inner(owner_id)")
      .eq("id", data.contributionId).maybeSingle();
    if (!contribution || (contribution as any).weddings?.owner_id !== context.userId) throw new Error("Contribution not found.");
    assertRefundable(contribution.status, contribution.provider_payment_id);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: refundId, error: beginError } = await supabaseAdmin.rpc("begin_refund", {
      _contribution_id: contribution.id,
      _amount: data.amount,
      _reason: data.reason,
      _requested_by: context.userId,
    });
    if (beginError || !refundId) throw new Error(beginError?.message ?? "The refund could not be started.");

    let response: Response;
    try {
      response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(contribution.provider_payment_id!)}/refund`, {
        method: "POST",
        headers: { authorization: razorpayKeys().authorization, "content-type": "application/json" },
        body: JSON.stringify({ amount: data.amount * 100, speed: "normal", notes: { dreamknot_refund_id: refundId } }),
      });
    } catch {
      throw new Error("Razorpay did not confirm the refund. Use Check status before trying another refund.");
    }

    if (!response.ok) {
      console.error("Razorpay refund failed", response.status);
      await supabaseAdmin.from("refunds").update({ status: "failed" }).eq("id", refundId);
      throw new Error("Razorpay could not process this refund. No refund was approved.");
    }
    const refund = await response.json() as ProviderRefund;
    const { error: finishError } = await supabaseAdmin.rpc("finish_refund", {
      _refund_id: refundId,
      _provider_refund_id: refund.id,
      _status: refund.status === "processed" ? "processed" : refund.status === "failed" ? "failed" : "pending",
    });
    if (finishError) throw new Error("Razorpay initiated the refund, but it still needs a status check.");
    return { refundId, status: refund.status };
  });

export const refreshRefund = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { refundId: string }) => z.object({ refundId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: refund } = await context.supabase.from("refunds")
      .select("id, status, provider_refund_id, contribution_id, wedding_id").eq("id", data.refundId).maybeSingle();
    if (!refund) throw new Error("Refund not found.");
    const [{ data: contribution }, { data: wedding }] = await Promise.all([
      context.supabase.from("contributions").select("provider_payment_id").eq("id", refund.contribution_id).single(),
      context.supabase.from("weddings").select("owner_id").eq("id", refund.wedding_id).single(),
    ]);
    if (!contribution?.provider_payment_id || wedding?.owner_id !== context.userId) throw new Error("Refund not found.");

    const endpoint = refund.provider_refund_id
      ? `https://api.razorpay.com/v1/refunds/${encodeURIComponent(refund.provider_refund_id)}`
      : `https://api.razorpay.com/v1/payments/${encodeURIComponent(contribution.provider_payment_id)}/refunds`;
    const response = await fetch(endpoint, { headers: { authorization: razorpayKeys().authorization } });
    if (!response.ok) throw new Error("Razorpay could not refresh this refund yet.");
    const body = await response.json() as ProviderRefund | { items?: ProviderRefund[] };
    const providerRefund = "id" in body
      ? body
      : body.items?.find((item) => item.id === refund.provider_refund_id || item.notes?.dreamknot_refund_id === refund.id);
    if (!providerRefund) return { status: refund.status, found: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const status = providerRefund.status === "processed" ? "processed" : providerRefund.status === "failed" ? "failed" : "pending";
    const { error } = await supabaseAdmin.rpc("finish_refund", {
      _refund_id: refund.id,
      _provider_refund_id: providerRefund.id,
      _status: status,
    });
    if (error) throw new Error("The refund status could not be saved.");
    return { status, found: true };
  });
