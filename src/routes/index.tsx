import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plane, Gift, ShieldCheck } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { dreams, gifts } from "@/lib/demo";
import { DreamCard, GiftCard } from "@/components/dk/Cards";
import { SectionTitle } from "@/components/dk/Site";
import { steps } from "./how-it-works";
import { plans } from "./pricing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DreamKnot — Make Their Dreams the Greatest Gift" },
      { name: "description", content: "Couples create a wedding page; guests contribute to honeymoons, homes and collaborative gifts." },
      { property: "og:title", content: "DreamKnot — Make Their Dreams the Greatest Gift" },
      { property: "og:description", content: "Wedding gifting for dream experiences and collaborative gifts." },
    ],
  }),
  component: Home,
});

const faqs = [
  ["Who can create a wedding page?", "Any couple — or a friend on their behalf — can create one in minutes."],
  ["Can guests contribute any amount?", "Yes. Couples can suggest amounts, but guests are free to give what feels right."],
  ["What happens to money raised for a gift?", "Collaborative gift funds are used to purchase the approved gift — organisers can't withdraw them freely."],
  ["Is online payment live?", "Not yet. Secure payments are being added; the sample page shows how it will work."],
] as const;

function Home() {
  return (
    <>
      <section className="relative isolate min-h-[88vh] overflow-hidden">
        <img src={hero} alt="Couple on a lakeside terrace at golden hour" width={1600} height={1008} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-foreground/75 via-foreground/35 to-transparent" />
        <div className="mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-6 text-background">
          <p className="eyebrow fade-up">Tie Dreams. Gift Together.</p>
          <h1 className="fade-up mt-4 max-w-2xl text-5xl leading-[1.05] md:text-7xl">Make Their Dreams the Greatest Gift.</h1>
          <p className="fade-up mt-6 max-w-lg text-lg text-background/85">A beautiful way to celebrate love. Help couples experience more, dream bigger and receive gifts they truly want.</p>
          <div className="fade-up mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full bg-gold px-7 text-foreground hover:bg-gold/90">
              <Link to="/weddings/$slug" params={{ slug: "aarav-and-meera" }}>View a Wedding Page</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-background/60 bg-transparent px-7 text-background hover:bg-background/10 hover:text-background">
              <Link to="/how-it-works">Explore How It Works</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionTitle eyebrow="Two ways to gift" title="Give what they'll remember" />
        <div className="grid gap-6 md:grid-cols-2">
          {[
            { icon: Plane, t: "Dream Experiences", d: "Guests contribute towards honeymoons, travel, a first home and the experiences couples dream of." },
            { icon: Gift, t: "Collaborative Gifting", d: "Friends and family pool together to give one meaningful gift — no duplicates, no clutter." },
          ].map(({ icon: I, t, d }) => (
            <div key={t} className="rounded-2xl bg-card p-10 shadow-soft">
              <I className="h-6 w-6 text-gold" />
              <h3 className="mt-6 text-3xl">{t}</h3>
              <p className="mt-3 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle eyebrow="How it works" title="Five quiet steps" />
          <ol className="grid gap-8 md:grid-cols-5">
            {steps.map((s, i) => (
              <li key={s.t} className="text-center">
                <span className="font-serif text-5xl text-gold">{i + 1}</span>
                <p className="mt-3 font-medium">{s.t}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <SectionTitle eyebrow="Dream experiences" title="Dreams worth sharing" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{dreams.map((d) => <DreamCard key={d.id} d={d} />)}</div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <SectionTitle eyebrow="Collaborative gifting" title="One gift, many hands" />
        <div className="grid gap-6 md:grid-cols-3">{gifts.map((g) => <GiftCard key={g.id} g={g} />)}</div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Sample data for illustration.</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-center gap-10 rounded-3xl bg-foreground p-10 text-background md:grid-cols-2 md:p-16">
          <div>
            <p className="eyebrow">Sample wedding page</p>
            <h2 className="mt-3 text-4xl md:text-5xl">Aarav & Meera</h2>
            <p className="mt-4 text-background/75">See exactly what guests see — dreams, gifts and a place to leave a message.</p>
            <Button asChild className="mt-8 rounded-full bg-gold px-7 text-foreground hover:bg-gold/90">
              <Link to="/weddings/$slug" params={{ slug: "aarav-and-meera" }}>Open the sample</Link>
            </Button>
          </div>
          <img src={hero} alt="" loading="lazy" width={1600} height={1008} className="aspect-[4/3] w-full rounded-2xl object-cover" />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12 text-center">
        <ShieldCheck className="mx-auto h-7 w-7 text-gold" />
        <h2 className="mt-4 text-4xl">Trust, by design</h2>
        <p className="mt-4 text-muted-foreground">Transparent fees shown before every contribution. Gift funds are tied to the gift, not the organiser. Clear refund rules if a campaign is cancelled. Payment processing is being integrated and will be handled by a certified provider.</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionTitle eyebrow="Pricing" title="Simple, per wedding" />
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-2xl p-8 shadow-soft ${p.featured ? "bg-foreground text-background" : "bg-card"}`}>
              <h3 className="text-2xl">{p.name}</h3>
              <p className="mt-4 font-serif text-5xl">{p.price}</p>
              <p className="mt-1 text-sm opacity-70">per wedding</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center"><Link to="/pricing" className="text-sm underline underline-offset-4">Compare plans</Link></p>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <SectionTitle eyebrow="FAQ" title="Questions, answered" />
        <Accordion type="single" collapsible>
          {faqs.map(([q, a]) => (
            <AccordionItem key={q} value={q}><AccordionTrigger className="text-left text-base">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-5xl md:text-6xl">Your Story. Their Contribution. Your Dream.</h2>
        <Button asChild size="lg" className="mt-10 rounded-full px-8">
          <Link to="/weddings/$slug" params={{ slug: "aarav-and-meera" }}>See how it looks</Link>
        </Button>
      </section>
    </>
  );
}
