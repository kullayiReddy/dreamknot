import { z } from "zod";

export const paymentReviewSchema = z.object({
  contributionId: z.string().uuid(),
  paymentId: z.string().trim().regex(/^pay_[A-Za-z0-9]+$/, "Enter a Razorpay payment reference beginning with pay_"),
  note: z.string().trim().min(5, "Add a short review note").max(500),
});

export const refundRequestSchema = z.object({
  contributionId: z.string().uuid(),
  amount: z.number().int().min(1).max(500000),
  reason: z.string().trim().min(5, "Explain why this refund is approved").max(500),
});

export function assertCapturedPayment(
  payment: { id: string; order_id: string; amount: number; currency: string; status: string },
  expected: { paymentId?: string; orderId: string; amount: number },
) {
  if (expected.paymentId && payment.id !== expected.paymentId) throw new Error("The payment reference does not match.");
  if (payment.status !== "captured") throw new Error("This payment has not been captured by Razorpay.");
  if (payment.order_id !== expected.orderId) throw new Error("This payment belongs to a different order.");
  if (payment.amount !== expected.amount * 100 || payment.currency !== "INR") throw new Error("The payment amount or currency does not match this contribution.");
}

export function assertApprovableStatus(status: string) {
  if (status !== "pending") throw new Error("Only a pending contribution can be approved.");
}

export function assertRefundable(status: string, paymentId: string | null) {
  if (status !== "paid" || !paymentId) throw new Error("Only a confirmed payment with a payment reference can be refunded.");
}

export function remainingRefundable(amount: number, refunds: Array<{ amount: number; status: string }>) {
  const committed = refunds
    .filter((refund) => ["initiating", "pending", "processed"].includes(refund.status))
    .reduce((sum, refund) => sum + refund.amount, 0);
  return Math.max(0, amount - committed);
}
