import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentHero, PolicyPage, PolicySection, contentHead } from "@/components/dk/ContentPage";

export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => contentHead("Privacy Policy", "How DreamKnot handles account, wedding, guest contribution, AI writing, payment, and analytics information.", "/privacy"),
  component: Privacy,
});

function Privacy() {
  return (
    <>
      <ContentHero eyebrow="Your information" title="Privacy Policy" intro="This notice explains what DreamKnot collects, why it is used, which services process it, and the choices available to couples and guests." />
      <PolicyPage updated="14 November 2026">
        <PolicySection title="1. Information you provide">
          <p>Couples provide account sign-in information and wedding details such as names, a date and place, a story, image links, dreams, gifts, target amounts, and publication settings. Private drafts remain visible only to the owning account until published. If Google sign-in is selected, Google supplies the account information needed to authenticate you.</p>
          <p>Guests provide a name, contribution amount, and optional email address and message. DreamKnot stores the contribution status and Razorpay order and payment references so the guest and couple can confirm the payment.</p>
        </PolicySection>
        <PolicySection title="2. Payment information">
          <p>Razorpay processes payment credentials directly through its checkout. DreamKnot does not store your full card number, CVV, UPI PIN, net-banking password, or one-time password. Payment reviews and approved refunds store the reviewer, reason, amount, status, and provider references so couples and guests can track them. Razorpay and your bank handle information under their own privacy terms.</p>
        </PolicySection>
        <PolicySection title="3. AI writing">
          <p>When a couple chooses to generate a story or gift description, the wedding details, selected tone, and existing draft they submit are sent to Lovable’s AI Gateway to produce a draft. A generated draft is shown for editing and is not used as saved page copy until the couple explicitly applies and saves it.</p>
        </PolicySection>
        <PolicySection title="4. Visitor analytics">
          <p>DreamKnot uses Lovable’s visitor analytics. It uses no cookies, stores nothing on the visitor’s device, does not keep IP addresses, and does not identify visitors. Lovable collects this data for us. <a href="https://lovable.dev/privacy" target="_blank" rel="noreferrer" className="text-foreground underline decoration-gold underline-offset-4">Lovable’s privacy policy</a> explains how it handles it.</p>
          <p>It records pages visited, where visitors came from, their country, browser, operating system and device type, how long they stay, how fast pages load, errors, and which buttons and links they click. Detailed data is kept for 90 days and daily summaries for a year.</p>
          <p>Unless a visitor’s browser sends Global Privacy Control, clicks are recorded without a consent banner. Page visits, time on page, page speed, and errors are recorded for every visitor, without cookies and without identifying anyone.</p>
        </PolicySection>
        <PolicySection title="5. Browser storage">
          <p>DreamKnot uses browser storage to keep your sign-in session available and protect account-only pages. This is separate from Lovable’s cookie-free visitor analytics. Razorpay may use its own browser storage or cookies when its checkout opens.</p>
        </PolicySection>
        <PolicySection title="6. How information is used and shared">
          <p>Information is used to operate accounts and wedding pages, display published content, process and confirm contributions, prevent misuse, provide support, meet legal obligations, and improve the service. Published wedding details, dreams, gifts, and progress are visible to people viewing the couple’s page; guest names, messages, and contribution records are visible to the couple in their dashboard. Couples should not publish sensitive information.</p>
          <p>Service providers process information only for their respective functions: Lovable Cloud for hosting, authentication and data storage, Razorpay for payments, Lovable’s AI Gateway for requested writing, and Google when Google sign-in is selected. Information may also be disclosed where required by law.</p>
        </PolicySection>
        <PolicySection title="7. Retention and deletion">
          <p>Account and wedding information is kept while the page is active and as needed for support, security, disputes, and legal obligations. A couple can delete a wedding page from its management screen; the page’s items and contribution records are then removed from the application database. Payment providers and banks may retain separate records under their own obligations.</p>
        </PolicySection>
        <PolicySection title="8. Security and your choices">
          <p>Access controls restrict couple-only management pages and contribution records to the account that owns the wedding. No online service can guarantee absolute security, so use a strong password and never share authentication or payment codes.</p>
          <p>You can edit or unpublish a wedding page through the dashboard. For access, correction, deletion, or other privacy questions, use the guidance on our <Link to="/contact" className="text-foreground underline decoration-gold underline-offset-4">Contact page</Link>. Privacy rights vary by location and applicable law.</p>
        </PolicySection>
        <PolicySection title="9. Children and updates">
          <p>DreamKnot accounts and contributions are intended for adults. We do not knowingly allow children to create accounts. We may revise this policy as the service changes and will post the latest revision date on this page.</p>
        </PolicySection>
      </PolicyPage>
    </>
  );
}
