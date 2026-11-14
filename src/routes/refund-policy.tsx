import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentHero, PolicyPage, PolicySection, contentHead } from "@/components/dk/ContentPage";

export const Route = createFileRoute("/refund-policy")({
  head: () => contentHead("Refund Policy", "How DreamKnot handles pending, failed, duplicate, incorrect, and confirmed guest contributions.", "/refund-policy"),
  component: RefundPolicy,
});

function RefundPolicy() {
  return (
    <>
      <ContentHero eyebrow="Payments with clarity" title="Refund Policy" intro="Wedding contributions are personal gifts. This policy explains when a payment is complete, what to do if something goes wrong, and how refund requests are reviewed." />
      <PolicyPage updated="14 November 2026">
        <PolicySection title="1. Check the payment status first">
          <p>After checkout, the contribution page shows “Payment confirmed,” “Payment pending,” or “Payment failed.” Only a confirmed payment is treated as a completed gift and included in the couple’s received total. Keep the payment reference shown on the confirmation page.</p>
        </PolicySection>
        <PolicySection title="2. Pending or failed payments">
          <p>If your bank shows a debit but DreamKnot still shows pending, do not immediately make another payment. Wait for the status to update and check with your bank or Razorpay if it remains unresolved. A failed contribution is not a completed gift; any bank hold or reversal is subject to the payment provider’s and bank’s timelines.</p>
        </PolicySection>
        <PolicySection title="3. Confirmed contributions">
          <p>A confirmed contribution is a gift to the named couple and is not automatically cancellable or refundable through DreamKnot. Changing your mind, changing a gift preference, or a change to the couple’s plans does not by itself create an automatic refund right. Nothing in this policy limits a right or remedy that applicable law requires.</p>
        </PolicySection>
        <PolicySection title="4. Duplicate or incorrect payments">
          <p>Requests involving a duplicate charge, an amount different from the one you intended, an unauthorised transaction, or another payment error are reviewed individually. Provide the payment reference, amount, payment date, wedding page, and a clear explanation. Never include your full card number, CVV, UPI PIN, password, or one-time password.</p>
          <p>Unauthorised-use claims should also be reported promptly to your bank or payment provider. A pending contribution can be approved in the couple’s payment admin only after Razorpay verifies that the referenced payment was captured for the same order and amount.</p>
        </PolicySection>
        <PolicySection title="5. Approved refunds">
          <p>A couple may approve a full or partial refund from their payment admin after reviewing the guest’s request and recording a reason. Approval is individual, not automatic. The refund is initiated to the original payment method through Razorpay.</p>
          <p>The time for the money to appear depends on Razorpay, the payment method, and the receiving bank. DreamKnot cannot promise a fixed credit date or redirect a refund to a different account. The contribution page shows the refund amount after it has been initiated.</p>
        </PolicySection>
        <PolicySection title="6. Couple cancellations and disputes">
          <p>Unpublishing or deleting a wedding page does not automatically reverse confirmed contributions. A couple and guest should first try to resolve a gift-related disagreement directly. Any required payment review will still need the original payment reference and may be subject to Razorpay’s dispute process.</p>
        </PolicySection>
        <PolicySection title="7. Requesting a review">
          <p>Guests should use the payment-request checklist on our <Link to="/contact" className="text-foreground underline decoration-gold underline-offset-4">Contact page</Link> and keep their confirmation page available. Couples can review requests and approve refunds from their wedding’s payment admin. DreamKnot’s support email has not yet been added, so no refund request can currently be submitted by email; do not send payment details to an unverified address.</p>
        </PolicySection>
      </PolicyPage>
    </>
  );
}
