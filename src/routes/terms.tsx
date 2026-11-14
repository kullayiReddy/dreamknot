import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentHero, PolicyPage, PolicySection, contentHead } from "@/components/dk/ContentPage";

export const Route = createFileRoute("/terms")({
  staticData: { sitemap: true },
  head: () => contentHead("Terms and Conditions", "The terms for couples and guests using DreamKnot wedding pages and contributions.", "/terms"),
  component: Terms,
});

function Terms() {
  return (
    <>
      <ContentHero eyebrow="The agreement" title="Terms and Conditions" intro="These terms explain the rules for creating a DreamKnot wedding page and contributing to a couple’s dream or collaborative gift." />
      <PolicyPage updated="14 November 2026">
        <PolicySection title="1. About DreamKnot">
          <p>DreamKnot provides tools for couples to publish wedding pages, describe dreams and gifts, and record guest contributions. Contributions are processed in Indian rupees through Razorpay. DreamKnot is not a bank, investment service, or provider of the travel, property, or products described on a wedding page.</p>
        </PolicySection>
        <PolicySection title="2. Accounts and eligibility">
          <p>You must be at least 18 years old and legally able to enter this agreement. Couples must provide accurate information, keep their sign-in credentials secure, and take responsibility for activity on their account. Google or email sign-in may be used to access an account.</p>
        </PolicySection>
        <PolicySection title="3. Wedding pages and content">
          <p>Couples are responsible for their names, story, images, gift descriptions, and other content. Content must be lawful, must not infringe another person’s rights, and must not be deceptive, hateful, sexually exploitative, or used for fraud. Optional AI writing tools produce drafts only; couples must review a draft before choosing to use it.</p>
          <p>You retain ownership of your content. You give DreamKnot permission to host, process, and display it as needed to operate and share your wedding page. Management-screen edits are saved as private drafts and change the public page only when you choose to publish them. An unpublished page is not available through its public wedding address.</p>
        </PolicySection>
        <PolicySection title="4. Guest contributions">
          <p>A guest chooses the couple, dream or gift, and amount before opening Razorpay’s secure checkout. Payment credentials are handled by Razorpay and its supported payment methods. A contribution is complete only when its status is “Payment confirmed” or “Confirmed”; a pending or failed entry is not a completed gift.</p>
          <p>Guests must provide accurate details and use a payment method they are authorised to use. Do not share a card PIN, UPI PIN, password, or one-time password with DreamKnot or a couple.</p>
        </PolicySection>
        <PolicySection title="5. Couple responsibilities">
          <p>Dream and gift descriptions are requests for wedding gifts, not promises made by DreamKnot. Couples are responsible for how they use contributions and for any tax or legal obligations that apply to them. DreamKnot’s current interface does not offer cash withdrawals, merchant fulfilment, or automatic gift purchasing.</p>
        </PolicySection>
        <PolicySection title="6. Payments and refunds">
          <p>Razorpay’s terms and payment-method rules also apply. Processing, settlement, reversal, and bank timelines can depend on Razorpay and the guest’s bank. Refund eligibility and the treatment of duplicate, incorrect, or disrupted payments are described in our <Link to="/refund-policy" className="text-foreground underline decoration-gold underline-offset-4">Refund Policy</Link>.</p>
        </PolicySection>
        <PolicySection title="7. Acceptable use">
          <p>You must not probe or disrupt the service, bypass access controls, upload malicious code, scrape personal information, impersonate another person, or use DreamKnot for money laundering, unlawful fundraising, or fraudulent transactions. We may restrict content or access where reasonably necessary to protect users, comply with law, or address payment-provider concerns.</p>
        </PolicySection>
        <PolicySection title="8. Availability and third parties">
          <p>We aim to keep DreamKnot useful and reliable but cannot promise uninterrupted availability. Authentication, cloud hosting, AI writing, analytics, and payments rely on third-party services. Their own terms and privacy practices may apply.</p>
        </PolicySection>
        <PolicySection title="9. Liability and consumer rights">
          <p>To the extent permitted by law, DreamKnot is not liable for indirect or consequential loss, a couple’s use of a gift, or delays caused by payment providers and banks. Nothing in these terms excludes rights or remedies that cannot lawfully be excluded.</p>
        </PolicySection>
        <PolicySection title="10. Changes, closure, and governing law">
          <p>Couples can delete a wedding page from its management screen. Deleting a page removes its associated items and contribution records from the service, subject to any records that must lawfully be retained elsewhere. We may update these terms as the service changes; the latest revision date appears above.</p>
          <p>These terms are governed by the laws of India, without limiting mandatory consumer protections that apply to you. Questions can be raised through our <Link to="/contact" className="text-foreground underline decoration-gold underline-offset-4">Contact page</Link>.</p>
        </PolicySection>
      </PolicyPage>
    </>
  );
}
