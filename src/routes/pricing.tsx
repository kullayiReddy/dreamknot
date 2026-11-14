import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SectionTitle } from "@/components/dk/Site";

export const plans = [
  { name: "Free", price: "₹0", featured: false, items: ["1 wedding page", "Up to 3 dreams", "Collaborative gifts", "Standard fees per contribution"] },
  { name: "Plus", price: "₹999", featured: true, items: ["Unlimited dreams & gifts", "Custom page link", "Guest message wall", "Reduced fees"] },
  { name: "Signature", price: "₹2,499", featured: false, items: ["Everything in Plus", "Premium themes", "Thank-you note tools", "Lowest fees"] },
];

export const Route = createFileRoute("/pricing")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Pricing — DreamKnot" },
      { name: "description", content: "Free, Plus ₹999 and Signature ₹2,499 per wedding." },
      { property: "og:title", content: "Pricing — DreamKnot" },
      { property: "og:description", content: "Simple per-wedding pricing for couples." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/pricing" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
  component: () => (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <SectionTitle eyebrow="Pricing" title="One price per wedding" sub="No subscriptions. Pay once for your celebration." />
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className={`rounded-2xl p-10 shadow-soft ${p.featured ? "bg-foreground text-background" : "bg-card"}`}>
            <h3 className="text-3xl">{p.name}</h3>
            <p className="mt-4 font-serif text-6xl">{p.price}</p>
            <ul className="mt-8 space-y-3 text-sm">
              {p.items.map((i) => <li key={i} className="flex gap-2"><Check className="h-4 w-4 text-gold" />{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  ),
});
