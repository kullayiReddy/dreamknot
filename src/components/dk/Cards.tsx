import { Gift as GiftIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "./Site";
import { formatINR, pct, type Dream, type Gift } from "@/lib/demo";

export function DreamCard({ d, onContribute }: { d: Dream; onContribute?: () => void }) {
  const p = pct(d.raised, d.target);
  return (
    <article className="motion-card group overflow-hidden rounded-2xl bg-card shadow-soft">
      <div className="aspect-[4/5] overflow-hidden">
        <img src={d.image} alt={d.title} loading="lazy" width={800} height={1008} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      </div>
      <div className="space-y-3 p-6">
        <p className="eyebrow">{d.category}</p>
        <h3 className="text-2xl">{d.title}</h3>
        <ProgressBar value={p} />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatINR(d.raised)} of {formatINR(d.target)}</span><span>{p}%</span>
        </div>
        {onContribute && (
          <Button variant="outline" onClick={onContribute} className="h-auto w-full rounded-full border-foreground py-2.5 hover:bg-foreground hover:text-background">
            Contribute
          </Button>
        )}
      </div>
    </article>
  );
}

export function GiftCard({ g, onContribute }: { g: Gift; onContribute?: () => void }) {
  const p = pct(g.raised, g.target);
  const done = p >= 100;
  return (
    <article className="motion-card rounded-2xl bg-card p-6 shadow-soft">
      <div className="flex items-start justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-gold"><GiftIcon className="h-5 w-5" /></div>
        <span className={`rounded-full px-3 py-1 text-xs ${done ? "bg-gold text-foreground" : "bg-muted text-muted-foreground"}`}>{done ? "Fully funded" : g.category}</span>
      </div>
      <h3 className="mt-5 text-2xl">{g.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">Organised by {g.organizer}</p>
      <div className="mt-5"><ProgressBar value={p} /></div>
      <div className="mt-2 flex justify-between text-sm text-muted-foreground">
        <span>{formatINR(g.raised)} of {formatINR(g.target)}</span>
        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{g.contributors}</span>
      </div>
      {onContribute && !done && (
        <Button variant="outline" onClick={onContribute} className="mt-5 h-auto w-full rounded-full border-foreground py-2.5 hover:bg-foreground hover:text-background">
          Chip in
        </Button>
      )}
    </article>
  );
}
