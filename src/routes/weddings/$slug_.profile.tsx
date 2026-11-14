import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Facebook, Globe2, Instagram, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero.jpg";
import { getPublicCoupleProfile } from "@/lib/wedding.functions";
import { safeSocialUrl } from "@/lib/couple-profile";

export const Route = createFileRoute("/weddings/$slug_/profile")({
  staticData: { sitemap: false },
  loader: async ({ params }) => {
    const result = await getPublicCoupleProfile({ data: { slug: params.slug } });
    if (!result) throw notFound();
    return result;
  },
  head: ({ loaderData, params }) => {
    const name = loaderData?.profile?.display_name || loaderData?.wedding.names;
    const title = name ? `Meet ${name} | DreamKnot` : "Couple profile unavailable — DreamKnot";
    const description = name ? `Meet ${name}, find their location and social links, and visit their DreamKnot wedding gift registry.` : "This couple profile is not available.";
    const path = `/weddings/${encodeURIComponent(params.slug)}/profile`;
    const image = loaderData?.wedding.cover_url || "";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: path },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(!loaderData ? [{ name: "robots", content: "noindex, follow" }] : []),
        ...(image.startsWith("https://") ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: path }],
    };
  },
  component: CoupleProfilePage,
});

function CoupleProfilePage() {
  const { wedding, profile } = Route.useLoaderData();
  const name = profile?.display_name || wedding.names;
  const location = profile?.location || wedding.place;
  const image = wedding.cover_url || hero;
  const links = [
    { label: "Instagram", href: safeSocialUrl(profile?.instagram_url ?? ""), icon: Instagram },
    { label: "Facebook", href: safeSocialUrl(profile?.facebook_url ?? ""), icon: Facebook },
    { label: "Website", href: safeSocialUrl(profile?.website_url ?? ""), icon: Globe2 },
  ].filter((link) => link.href);

  return (
    <>
      <section className="relative isolate h-[42vh] min-h-72 overflow-hidden">
        <img src={image} alt={`${name}'s wedding celebration`} className="hero-arrival absolute inset-0 -z-10 h-full w-full object-cover object-top" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-foreground/85 via-foreground/20 to-transparent" />
        <div className="flex h-full flex-col items-center justify-end px-6 pb-12 text-center text-background">
          <p className="eyebrow">Meet the couple</p>
          <h1 className="fade-up mt-3 text-5xl md:text-7xl">{name}</h1>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        {location && <p className="flex items-center justify-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-gold" />{location}</p>}
        {wedding.story && <blockquote className="mt-8 font-serif text-2xl leading-relaxed">“{wedding.story}”</blockquote>}
        {links.length > 0 && (
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {links.map(({ label, href, icon: Icon }) => (
              <Button asChild key={label} variant="outline" className="rounded-full px-5">
                <a href={href} target="_blank" rel="noreferrer"><Icon className="h-4 w-4" />{label}</a>
              </Button>
            ))}
          </div>
        )}
        <div className="mt-12 rounded-2xl bg-card p-8 shadow-soft">
          <p className="eyebrow">Celebrate with us</p>
          <h2 className="mt-3 text-3xl">{wedding.names}</h2>
          {[wedding.wedding_date, wedding.place].filter(Boolean).length > 0 && <p className="mt-2 text-sm text-muted-foreground">{[wedding.wedding_date, wedding.place].filter(Boolean).join(" · ")}</p>}
          <Button asChild className="mt-6 rounded-full px-6">
            <Link to="/weddings/$slug" params={{ slug: wedding.slug }}>View wedding & gifts<ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </>
  );
}
