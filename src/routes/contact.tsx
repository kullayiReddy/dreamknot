import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Heart, ReceiptText, ShieldCheck } from "lucide-react";
import { ContentHero, contentHead } from "@/components/dk/ContentPage";

const topics = [
  { icon: ReceiptText, title: "A guest contribution", text: "Keep your payment reference and contribution status page handy. If a payment is pending, wait for its status to update before trying again.", link: "/refund-policy", label: "Read payment and refund guidance" },
  { icon: Heart, title: "Your wedding page", text: "Sign in to edit your story, dreams, gifts, and publication settings. For details about a particular celebration, contact the couple directly.", link: "/dashboard", label: "Open your dashboard" },
  { icon: ShieldCheck, title: "Privacy or policy requests", text: "Review how account, wedding, contribution, and payment information is handled, and what to include in a policy request.", link: "/privacy", label: "Read the Privacy Policy" },
] as const;

export const Route = createFileRoute("/contact")({
  staticData: { sitemap: true },
  head: () => contentHead("Contact", "Find guidance for DreamKnot wedding pages, guest contributions, privacy requests, and refunds.", "/contact"),
  component: Contact,
});

function Contact() {
  return (
    <>
      <ContentHero eyebrow="Contact" title="A little help, when you need it" intro="Start with the topic that best matches your question. Including the right details will make a support request easier to resolve." />
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {topics.map(({ icon: Icon, title, text, link, label }) => (
            <article key={title} className="motion-card flex flex-col rounded-2xl bg-card p-7 shadow-soft">
              <Icon className="h-6 w-6 text-gold" strokeWidth={1.5} />
              <h2 className="mt-5 text-3xl">{title}</h2>
              <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">{text}</p>
              <Link to={link} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground underline decoration-gold underline-offset-4">{label}<ArrowUpRight className="h-4 w-4 text-gold" /></Link>
            </article>
          ))}
        </div>
        <div data-motion="reveal" className="mx-auto mt-12 max-w-3xl rounded-2xl border border-gold/40 bg-secondary/35 p-7 text-center">
          <h2 className="text-3xl">Preparing a support request</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">For a payment question, include the payment reference, amount, date, and the last four digits of the card only when relevant. Never share your full card number, UPI PIN, password, or one-time password.</p>
          <p className="mt-4 text-sm font-medium">DreamKnot’s support email has not been added yet. Check back here for the contact address before sending a request.</p>
        </div>
      </section>
    </>
  );
}
