import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export async function publicWeddingSlugs(client: SupabaseClient<Database>): Promise<string[]> {
  const slugs: string[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; ) {
    const { data, error } = await client.from("weddings").select("slug").eq("published", true).order("id").range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!data) throw new Error("Wedding sitemap query returned no result");
    if (data.length === 0) break;
    slugs.push(...data.map(row => row.slug));
    offset += data.length;
  }
  return slugs;
}
