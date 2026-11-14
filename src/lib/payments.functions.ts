import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCapturedPayment } from "@/lib/payment-admin";

function keys() {
  const id = process.env["RAZORPAY_KEY_ID"];
  const secret = process.env["RAZORPAY_KEY_SECRET"];
  if (!id || !secret) throw new Error("Payments are not set up yet.");
  return { id, secret };
}

async function hmacHex(secret: string, msg: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

type OrderInput = { itemId: string; amount: number; guestName: string; guestEmail: string; message: string };

export const getPaymentSetup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const id = process.env["RAZORPAY_KEY_ID"];
    const secret = process.env["RAZORPAY_KEY_SECRET"];
    return { configured: Boolean(id && secret), live: Boolean(id?.startsWith("rzp_live_")) };
  });

export const createContributionOrder = createServerFn({ method: "POST" })
  .inputValidator((i: OrderInput) => {
    const amount = Math.floor(Number(i.amount));
    if (!Number.isFinite(amount) || amount < 100 || amount > 500000) throw new Error("Amount must be between ₹100 and ₹5,00,000.");
    const guestName = String(i.guestName ?? "").trim().slice(0, 80);
    if (!guestName) throw new Error("Please enter your name.");
    return { itemId: String(i.itemId), amount, guestName, guestEmail: String(i.guestEmail ?? "").trim().slice(0, 120), message: String(i.message ?? "").trim().slice(0, 500) };
  })
  .handler(async ({ data }) => {
    const { id, secret } = keys();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: item } = await supabaseAdmin.from("items").select("id, title, wedding_id, weddings!inner(published, names)").eq("id", data.itemId).eq("archived", false).maybeSingle();
    if (!item || !(item as any).weddings?.published) throw new Error("This gift is not available.");
    const { data: c, error } = await supabaseAdmin.from("contributions").insert({
      wedding_id: item.wedding_id, item_id: item.id, amount: data.amount,
      guest_name: data.guestName, guest_email: data.guestEmail, message: data.message,
    }).select("id").single();
    if (error || !c) throw new Error("Could not start payment.");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Basic " + btoa(`${id}:${secret}`) },
      body: JSON.stringify({ amount: data.amount * 100, currency: "INR", receipt: c.id.slice(0, 40) }),
    });
    if (!res.ok) {
      await supabaseAdmin.from("contributions").update({ status: "failed" }).eq("id", c.id);
      console.error("razorpay order failed", res.status, await res.text());
      throw new Error("Payment provider is unavailable. Please try again.");
    }
    const order = (await res.json()) as { id: string };
    await supabaseAdmin.from("contributions").update({ provider_order_id: order.id }).eq("id", c.id);
    return { contributionId: c.id, orderId: order.id, keyId: id, amount: data.amount * 100, title: item.title, couple: (item as any).weddings.names as string };
  });

export const verifyContribution = createServerFn({ method: "POST" })
  .inputValidator((i: { orderId: string; paymentId: string; signature: string }) => ({ orderId: String(i.orderId), paymentId: String(i.paymentId), signature: String(i.signature) }))
  .handler(async ({ data }) => {
    const { id, secret } = keys();
    const expected = await hmacHex(secret, `${data.orderId}|${data.paymentId}`);
    if (expected !== data.signature) throw new Error("Payment could not be verified.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: contribution } = await supabaseAdmin.from("contributions").select("amount").eq("provider_order_id", data.orderId).maybeSingle();
    if (!contribution) throw new Error("Payment could not be matched to a contribution.");
    const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(data.paymentId)}`, {
      headers: { authorization: "Basic " + btoa(`${id}:${secret}`) },
    });
    if (!response.ok) throw new Error("Razorpay could not confirm this payment yet.");
    const payment = await response.json() as { id: string; order_id: string; amount: number; currency: string; status: string };
    assertCapturedPayment(payment, { paymentId: data.paymentId, orderId: data.orderId, amount: contribution.amount });
    const { data: cid, error } = await supabaseAdmin.rpc("mark_contribution_paid", { _order_id: data.orderId, _payment_id: data.paymentId });
    if (error) throw new Error("Payment could not be recorded.");
    return { contributionId: cid as string };
  });

export const getContributionStatus = createServerFn({ method: "GET" })
  .inputValidator((i: { id: string }) => {
    if (!/^[0-9a-f-]{36}$/.test(String(i.id))) throw new Error("Invalid id");
    return { id: String(i.id) };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: c } = await supabaseAdmin.from("contributions")
      .select("id, amount, status, guest_name, created_at, paid_at, provider_payment_id, items(title), weddings(names, slug), refunds(amount, status)")
      .eq("id", data.id).maybeSingle();
    if (!c) return null;
    const refunds = ((c as any).refunds ?? []) as Array<{ amount: number; status: string }>;
    const refundedAmount = refunds.filter((refund) => ["pending", "processed"].includes(refund.status)).reduce((sum, refund) => sum + refund.amount, 0);
    return {
      id: c.id, amount: c.amount, status: c.status, guestName: c.guest_name, paidAt: c.paid_at, paymentRef: c.provider_payment_id, refundedAmount,
      itemTitle: (c as any).items?.title as string, couple: (c as any).weddings?.names as string, slug: (c as any).weddings?.slug as string,
    };
  });
