import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { publicWeddingSlugs } from "@/lib/sitemap-weddings.server";
import { sitemapXML } from "@/lib/sitemap";

function mockClient(batches: Array<{ data: Array<{ slug: string }> | null; error: Error | null }>) {
  const range = vi.fn();
  batches.forEach(batch => range.mockResolvedValueOnce(batch));
  const order = vi.fn(() => ({ range }));
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { client: { from } as unknown as SupabaseClient<Database>, range, eq, order };
}
describe("public wedding sitemap", () => {
  it("includes published weddings across every batch", async () => {
    const mock = mockClient([{ data: [{ slug: "first" }], error: null }, { data: [{ slug: "second" }], error: null }, { data: [], error: null }]);
    expect(await publicWeddingSlugs(mock.client)).toEqual(["first", "second"]);
    expect(mock.eq).toHaveBeenCalledWith("published", true);
    expect(mock.order).toHaveBeenCalledWith("id");
    expect(mock.range.mock.calls).toEqual([[0, 999], [1, 1000], [2, 1001]]);
  });
  it("rejects later-batch errors instead of serving partial content", async () => {
    const mock = mockClient([{ data: [{ slug: "first" }], error: null }, { data: null, error: new Error("source unavailable") }]);
    await expect(publicWeddingSlugs(mock.client)).rejects.toThrow("source unavailable");
  });
  it("does not invent content modification dates", () => {
    const xml = sitemapXML("https://create-and-grow-bot.lovable.app", [{ path: "/weddings/first" }]);
    expect(xml).toContain("https://create-and-grow-bot.lovable.app/weddings/first");
    expect(xml).not.toContain("lastmod");
  });
});