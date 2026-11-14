import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getPublicWedding = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug).slice(0, 80) }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: w } = await sb.from("weddings").select("id, slug, names, wedding_date, place, story, cover_url").eq("slug", data.slug).eq("published", true).maybeSingle();
    if (!w) return null;
    const { data: items } = await sb.from("items").select("id, kind, title, category, description, image_url, target, raised, contributors").eq("wedding_id", w.id).eq("archived", false).order("created_at");
    return { wedding: w, items: items ?? [] };
  });

export const getPublicCoupleProfile = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug).slice(0, 80) }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: wedding, error: weddingError } = await sb.from("weddings").select("id, slug, names, wedding_date, place, story, cover_url").eq("slug", data.slug).eq("published", true).maybeSingle();
    if (weddingError) throw new Error("Could not load this wedding.");
    if (!wedding) return null;
    const { data: profile, error: profileError } = await sb.from("couple_profiles").select("display_name, location, instagram_url, facebook_url, website_url").eq("wedding_id", wedding.id).maybeSingle();
    if (profileError) throw new Error("Could not load this couple profile.");
    return { wedding, profile };
  });
