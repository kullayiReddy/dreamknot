import { describe, expect, it } from "vitest";
import { assertCapturedPayment } from "@/lib/payment-admin";

const captured = { id: "pay_123", order_id: "order_123", amount: 500000, currency: "INR", status: "captured" };
const expected = { paymentId: "pay_123", orderId: "order_123", amount: 5000 };

describe("Razorpay payment confirmation", () => {
  it("accepts a captured payment matching the reference, order, amount, and currency", () => {
    expect(() => assertCapturedPayment(captured, expected)).not.toThrow();
  });

  it("does not confirm an authorized but uncaptured payment", () => {
    expect(() => assertCapturedPayment({ ...captured, status: "authorized" }, expected)).toThrow("not been captured");
  });

  it("does not confirm a payment for another order", () => {
    expect(() => assertCapturedPayment({ ...captured, order_id: "order_other" }, expected)).toThrow("different order");
  });

  it("does not confirm a mismatched amount or currency", () => {
    expect(() => assertCapturedPayment({ ...captured, amount: 100 }, expected)).toThrow("amount or currency");
    expect(() => assertCapturedPayment({ ...captured, currency: "USD" }, expected)).toThrow("amount or currency");
  });
});
