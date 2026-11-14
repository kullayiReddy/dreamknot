import { createFileRoute } from "@tanstack/react-router";
import { getRouterInstance } from "@tanstack/react-start";
import { isSitemapRouteIncluded, sitemapPathForLocation, sitemapStaticPaths, sitemapXML, type SitemapEntry } from "@/lib/sitemap";

const BASE_URL = "https://dreamknot.lovable.app";
export const Route = createFileRoute("/sitemap.xml")({
  staticData: { sitemap: false },
  server: { handlers: { GET: async () => {
    try {
      const router = await getRouterInstance();
      const entries: SitemapEntry[] = sitemapStaticPaths(router).map(path => ({ path }));
      const routeId = "/weddings/$slug";
      if (isSitemapRouteIncluded(router.routesById[routeId])) {
        const { createClient } = await import("@supabase/supabase-js");
        const { publicWeddingSlugs } = await import("@/lib/sitemap-weddings.server");
        const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
        const client = createClient<import("@/integrations/supabase/types").Database>(process.env['SUPABASE_URL']!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { fetch: (input, init) => {
            const headers = new Headers(init?.headers);
            if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
            headers.set("apikey", key);
            return fetch(input, { ...init, headers });
          } },
        });
        for (const slug of await publicWeddingSlugs(client)) {
          const location = router.buildLocation({ to: "/weddings/$slug", params: { slug }, search: () => ({}), hash: "" });
          const path = sitemapPathForLocation(router, location, routeId);
          if (path) entries.push({ path });
        }
      }
      if (entries.length === 0) return new Response("No public pages", { status: 404, headers: { "Cache-Control": "no-store" } });
      return new Response(sitemapXML(BASE_URL, entries), { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=300" } });
    } catch (error) {
      console.error("Sitemap query failed", error);
      return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
    }
  } } },
});
