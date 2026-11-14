import { createFileRoute, Link } from "@tanstack/react-router";
import { SectionTitle } from "@/components/dk/Site";
import { couple } from "@/lib/demo";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Weddings — DreamKnot" },
      { name: "description", content: "Browse public DreamKnot wedding pages." },
      { property: "og:title", content: "Explore Weddings — DreamKnot" },
      { property: "og:description", content: "Browse public DreamKnot wedding pages." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <SectionTitle eyebrow="Explore" title="Celebrations on DreamKnot" />
      <div className="grid gap-6 md:grid-cols-3">
        <Link to="/weddings/$slug" params={{ slug: couple.slug }} className="motion-card group overflow-hidden rounded-2xl bg-card shadow-soft">
          <img src={couple.image} alt={couple.names} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="p-6"><h3 className="text-2xl">{couple.names}</h3><p className="text-sm text-muted-foreground">{couple.date} · {couple.place}</p><p className="mt-2 text-xs text-gold">Sample page</p></div>
        </Link>
      </div>
    </section>
  ),
});
