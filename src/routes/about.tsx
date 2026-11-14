import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Heart, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentHero, contentHead } from "@/components/dk/ContentPage";

const values = [
  { icon: Heart, title: "Meaning over more", text: "A wedding gift can become a journey, a home, or a memory a couple carries for years." },
  { icon: Users, title: "Better together", text: "Friends and family can take part at a level that feels comfortable, with a personal message alongside their gift." },
  { icon: Sparkles, title: "Personal by design", text: "Couples shape their own page, dreams, and words. Optional writing tools help them draft, never publish without their say." },
];

export const Route = createFileRoute("/about")({
  staticData: { sitemap: true },
  head: () => contentHead("About", "Why DreamKnot helps wedding guests fund meaningful experiences and shared gifts.", "/about"),
  component: About,
});

function About() {
  return (
    <>
      <ContentHero eyebrow="Our story" title="A gift can become part of their forever" intro="DreamKnot brings wedding gifting closer to what couples truly want: experiences to remember, milestones to reach, and a way for everyone they love to take part." />
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {values.map(({ icon: Icon, title, text }) => (
            <article key={title} className="motion-card rounded-2xl bg-card p-8 shadow-soft">
              <Icon className="h-6 w-6 text-gold" strokeWidth={1.5} />
              <h2 className="mt-5 text-3xl">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
        <div data-motion="reveal" className="mx-auto mt-16 max-w-3xl text-center">
          <p className="eyebrow">How it began</p>
          <h2 className="mt-4 text-4xl md:text-5xl">From another envelope to a shared dream</h2>
          <p className="mt-6 leading-8 text-muted-foreground">Traditional wedding gifts do not always reflect a couple’s plans. DreamKnot gives couples one beautiful place to tell their story, list the experiences and gifts that matter to them, and follow every confirmed contribution. Guests get a clear, personal way to celebrate them.</p>
          <p className="mt-4 leading-8 text-muted-foreground">The platform currently supports Indian-rupee contributions through Razorpay, with payment confirmation shown to both the guest and the couple.</p>
          <Button asChild className="mt-8 rounded-full px-6"><Link to="/auth">Create your wedding page <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </section>
    </>
  );
}
