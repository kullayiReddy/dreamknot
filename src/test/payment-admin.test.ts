import { describe, expect, it } from "vitest";
import { assertApprovableStatus, assertRefundable, remainingRefundable } from "@/lib/payment-admin";

describe("Payment review and refund rules", () => {
  it("allows manual approval only for pending contributions", () => {
    expect(() => assertApprovableStatus("pending")).not.toThrow();
    expect(() => assertApprovableStatus("paid")).toThrow("Only a pending contribution");
    expect(() => assertApprovableStatus("failed")).toThrow("Only a pending contribution");
  });

  it("allows refunds only for confirmed payments with a provider reference", () => {
    expect(() => assertRefundable("paid", "pay_123")).not.toThrow();
    expect(() => assertRefundable("pending", "pay_123")).toThrow("Only a confirmed payment");
    expect(() => assertRefundable("paid", null)).toThrow("Only a confirmed payment");
  });

  it("subtracts active refunds but not failed refunds from the remaining amount", () => {
    const remaining = remainingRefundable(5000, [
      { amount: 1000, status: "processed" },
      { amount: 500, status: "pending" },
      { amount: 4000, status: "failed" },
    ]);
    expect(remaining).toBe(3500);
  });
});
