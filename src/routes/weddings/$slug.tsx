import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { couple as demoCouple, dreams as demoDreams, gifts as demoGifts, formatINR, type Dream, type Gift } from "@/lib/demo";
import hero from "@/assets/hero.jpg";
import { DreamCard, GiftCard } from "@/components/dk/Cards";
import { SectionTitle } from "@/components/dk/Site";
import { getPublicWedding } from "@/lib/wedding.functions";
import { createContributionOrder, verifyContribution } from "@/lib/payments.functions";

type PageData = { demo: boolean; names: string; date: string; place: string; story: string; image: string; dreams: Dream[]; gifts: Gift[] };

export const Route = createFileRoute("/weddings/$slug")({
  staticData: { sitemap: true },
  loader: async ({ params }): Promise<PageData> => {
    if (params.slug === demoCouple.slug) return { demo: true, names: demoCouple.names, date: demoCouple.date, place: demoCouple.place, story: demoCouple.story, image: demoCouple.image, dreams: demoDreams, gifts: demoGifts };
    const res = await getPublicWedding({ data: { slug: params.slug } });
    if (!res) throw notFound();
    const { wedding: w, items } = res;
    return {
      demo: false, names: w.names, date: w.wedding_date, place: w.place, story: w.story, image: w.cover_url || hero,
      dreams: items.filter((i) => i.kind === "dream").map((i) => ({ id: i.id, title: i.title, category: i.category, image: i.image_url || hero, target: i.target, raised: i.raised, description: i.description, suggested: [2100, 5100, 11000] })),
      gifts: items.filter((i) => i.kind === "gift").map((i) => ({ id: i.id, name: i.title, category: i.category || "Group gift", target: i.target, raised: i.raised, contributors: i.contributors, organizer: w.names, description: i.description })),
    };
  },
  head: ({ loaderData, params }) => {
    const t = loaderData ? `${loaderData.names} — Wedding Gift Registry | DreamKnot` : "Wedding unavailable — DreamKnot";
    const celebration = loaderData ? [loaderData.date, loaderData.place].filter(Boolean).join(" · ") : "";
    const d = loaderData ? `Celebrate ${loaderData.names}${celebration ? ` (${celebration})` : ""}. Explore their wedding gift registry and contribute to their dreams and group gifts.` : "This wedding page is not available.";
    const path = `/weddings/${encodeURIComponent(params.slug)}`;
    return {
      meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:url", content: path }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, ...(!loaderData || loaderData.demo ? [{ name: "robots", content: "noindex, follow" }] : []), ...(loaderData?.image.startsWith("https://") ? [{ property: "og:image", content: loaderData.image }, { name: "twitter:image", content: loaderData.image }] : [])],
      links: [{ rel: "canonical", href: path }],
    };
  },
  component: WeddingPage,
});

declare global { interface Window { Razorpay?: any } }
function loadCheckout() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function WeddingPage() {
  const p = Route.useLoaderData();
  const navigate = useNavigate();
  const createOrder = useServerFn(createContributionOrder);
  const verify = useServerFn(verifyContribution);
  const [target, setTarget] = useState<{ id: string; title: string; suggested: number[] } | null>(null);
  const [amount, setAmount] = useState<number | "">("");
  const [guest, setGuest] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);
  const open = (id: string, title: string, suggested = [2100, 5100, 11000]) => { setTarget({ id, title, suggested }); setAmount(""); };

  async function pay() {
    if (!target || !amount) return undefined;
    if (amount < 100) { toast.error("Minimum contribution is ₹100"); return; }
    if (!guest.name.trim()) { toast.error("Please enter your name"); return; }
    setBusy(true);
    try {
      const ok = await loadCheckout();
      if (!ok) throw new Error("Could not load payment window");
      const order = await createOrder({ data: { itemId: target.id, amount: Number(amount), guestName: guest.name, guestEmail: guest.email, message: guest.message } });
      const rz = new window.Razorpay({
        key: order.keyId, order_id: order.orderId, amount: order.amount, currency: "INR",
        name: "DreamKnot", description: `${order.title} for ${order.couple}`,
        prefill: { name: guest.name, email: guest.email },
        theme: { color: "#b8955a" },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await verify({ data: { orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature } });
          } catch { toast.error("We couldn't confirm the payment yet."); }
          navigate({ to: "/contribution/$id", params: { id: order.contributionId } });
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      setTarget(null);
      rz.open();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
      setBusy(false);
    }
  }

  return (
    <>
      <section className="relative isolate h-[70vh] overflow-hidden">
        <img src={p.image} alt={p.names} className="hero-arrival absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-foreground/80 to-transparent" />
        <div className="flex h-full flex-col items-center justify-end pb-16 text-center text-background">
          <p className="eyebrow">{[p.date, p.place].filter(Boolean).join(" · ")}</p>
          <h1 className="fade-up mt-3 text-6xl md:text-8xl">{p.names}</h1>
        </div>
      </section>
      {p.story && <p className="mx-auto max-w-2xl px-6 py-16 text-center font-serif text-2xl leading-relaxed">“{p.story}”</p>}

      {p.dreams.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <SectionTitle eyebrow="Our dreams" title="Help us experience more" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {p.dreams.map((d) => <DreamCard key={d.id} d={d} onContribute={() => open(d.id, d.title, d.suggested)} />)}
          </div>
        </section>
      )}
      {p.gifts.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <SectionTitle eyebrow="Gifts together" title="Chip in with friends" />
          <div className="grid gap-6 md:grid-cols-3">
            {p.gifts.map((g) => <GiftCard key={g.id} g={g} onContribute={() => open(g.id, g.name)} />)}
          </div>
        </section>
      )}

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
          <input type="number" min={100} placeholder="Or enter your own amount" value={amount} onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")} className={field} />
          {p.demo ? (
            <>
              <button disabled className="rounded-full bg-muted py-3 text-sm font-medium text-muted-foreground">Sample page — payments disabled</button>
              <p className="text-center text-xs text-muted-foreground">Create your own page to receive real contributions.</p>
            </>
          ) : (
            <>
              <input placeholder="Your name" value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} className={field} />
              <input type="email" placeholder="Email (for your receipt)" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} className={field} />
              <input placeholder="A message for the couple (optional)" value={guest.message} onChange={(e) => setGuest({ ...guest, message: e.target.value })} className={field} />
              <button onClick={pay} disabled={busy || !amount} className="rounded-full bg-foreground py-3 text-sm font-medium text-background disabled:opacity-50">
                {busy ? "Opening secure payment…" : `Contribute ${amount ? formatINR(Number(amount)) : ""}`}
              </button>
              <p className="text-center text-xs text-muted-foreground">Secure payment by Razorpay · UPI, cards, netbanking</p>
              <p className="text-center text-xs text-muted-foreground">By contributing, you agree to the <Link to="/terms" className="underline">Terms</Link> and <Link to="/refund-policy" className="underline">Refund Policy</Link>.</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
const field = "rounded-full border border-input bg-card px-5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
