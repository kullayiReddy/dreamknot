import { createFileRoute } from "@tanstack/react-router";
import { SectionTitle } from "@/components/dk/Site";

export const steps = [
  { t: "Create your wedding page", d: "Add your names, date, venue and a few words about your story." },
  { t: "Add your dreams and gifts", d: "Set goals like a honeymoon or home, or list a gift friends can pool for." },
  { t: "Share your personalised link", d: "Send it on WhatsApp, email or print it on your invitation." },
  { t: "Guests contribute", d: "Any amount, with a heartfelt message attached." },
  { t: "Celebrate what everyone made possible", d: "Track every contribution and thank guests personally." },
];

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How DreamKnot Works" },
      { name: "description", content: "Create a wedding page, add dreams and gifts, share the link, and let guests contribute." },
      { property: "og:title", content: "How DreamKnot Works" },
      { property: "og:description", content: "Five simple steps from wedding page to shared dreams." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/how-it-works" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/how-it-works" }],
  }),
  component: () => (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <SectionTitle eyebrow="How it works" title="From first page to final thank-you" />
      <ol className="space-y-10">
        {steps.map((s, i) => (
          <li key={s.t} className="flex gap-6 border-b border-border pb-10">
            <span className="font-serif text-5xl text-gold">{i + 1}</span>
            <div><h3 className="text-3xl">{s.t}</h3><p className="mt-2 text-muted-foreground">{s.d}</p></div>
          </li>
        ))}
      </ol>
    </section>
  ),
});
