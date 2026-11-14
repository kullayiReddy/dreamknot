import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { couple, dreams, gifts, formatINR } from "@/lib/demo";
import { DreamCard, GiftCard } from "@/components/dk/Cards";
import { SectionTitle } from "@/components/dk/Site";

export const Route = createFileRoute("/weddings/$slug")({
  loader: ({ params }) => { if (params.slug !== couple.slug) throw notFound(); return couple; },
  head: () => ({
    meta: [
      { title: `${couple.names} — DreamKnot` },
      { name: "description", content: `Celebrate ${couple.names} by contributing to their dreams and gifts.` },
      { property: "og:title", content: `${couple.names} — DreamKnot` },
      { property: "og:description", content: couple.story },
    ],
  }),
  component: WeddingPage,
});

function WeddingPage() {
  const [target, setTarget] = useState<{ title: string; suggested: number[] } | null>(null);
  const [amount, setAmount] = useState<number | "">("");
  const open = (title: string, suggested = [2100, 5100, 11000]) => { setTarget({ title, suggested }); setAmount(""); };

  return (
    <>
      <section className="relative isolate h-[70vh] overflow-hidden">
        <img src={couple.image} alt={couple.names} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-foreground/80 to-transparent" />
        <div className="flex h-full flex-col items-center justify-end pb-16 text-center text-background">
          <p className="eyebrow">{couple.date} · {couple.place}</p>
          <h1 className="fade-up mt-3 text-6xl md:text-8xl">{couple.names}</h1>
        </div>
      </section>
      <p className="mx-auto max-w-2xl px-6 py-16 text-center font-serif text-2xl leading-relaxed">“{couple.story}”</p>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <SectionTitle eyebrow="Our dreams" title="Help us experience more" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dreams.map((d) => <DreamCard key={d.id} d={d} onContribute={() => open(d.title, d.suggested)} />)}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionTitle eyebrow="Gifts together" title="Chip in with friends" />
        <div className="grid gap-6 md:grid-cols-3">
          {gifts.map((g) => <GiftCard key={g.id} g={g} onContribute={() => open(g.name)} />)}
        </div>
      </section>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl font-medium">{target?.title}</DialogTitle>
            <DialogDescription>Choose an amount to contribute.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {target?.suggested.map((s) => (
              <button key={s} onClick={() => setAmount(s)} className={`rounded-full border py-2 text-sm ${amount === s ? "border-foreground bg-foreground text-background" : "border-border"}`}>{formatINR(s)}</button>
            ))}
          </div>
          <input type="number" min={1} placeholder="Or enter your own amount" value={amount} onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")} className="rounded-full border border-input bg-card px-5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <button disabled className="rounded-full bg-muted py-3 text-sm font-medium text-muted-foreground">Payments coming soon</button>
          <p className="text-center text-xs text-muted-foreground">This is a sample page — no money is collected.</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
