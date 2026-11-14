import type { ReactNode } from "react";

export function contentHead(title: string, description: string, path: string) {
  return {
    meta: [
      { title: `${title} — DreamKnot` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — DreamKnot` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: path },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: path }],
  };
}

export function ContentHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <header className="border-b border-border/70">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center md:py-24">
        <p className="eyebrow fade-up">{eyebrow}</p>
        <h1 className="fade-up mt-4 text-5xl leading-tight md:text-7xl">{title}</h1>
        <p className="fade-up mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">{intro}</p>
      </div>
    </header>
  );
}

export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section data-motion="reveal" className="border-b border-border py-8 last:border-0">
      <h2 className="text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground md:text-base">{children}</div>
    </section>
  );
}

export function PolicyPage({ updated, children }: { updated: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-20">
      <p className="pt-10 text-xs uppercase tracking-[0.18em] text-muted-foreground">Last updated {updated}</p>
      <div className="mt-6 rounded-2xl bg-card px-6 py-2 shadow-soft md:px-10">{children}</div>
    </div>
  );
}
