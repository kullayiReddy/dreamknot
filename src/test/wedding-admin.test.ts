import { describe, expect, it } from "vitest";
import { draftFromLive, weddingDraftSchema } from "@/lib/wedding-admin";

const liveWedding = { names: "Maya & Dev", wedding_date: "14 February 2027", place: "Jaipur", story: "Our live story", cover_url: "", published: true };
const liveItems = [{ id: "00000000-0000-4000-8000-000000000001", kind: "dream", title: "Honeymoon", category: "Travel", description: "Live description", image_url: "", target: 50000 }];

describe("Private wedding drafts", () => {
  it("copies live content so draft edits do not mutate the public values", () => {
    const draft = draftFromLive(liveWedding, liveItems);
    draft.details.story = "Private rewritten story";
    draft.items[0]!.title = "Private gift title";
    expect(liveWedding.story).toBe("Our live story");
    expect(liveItems[0]!.title).toBe("Honeymoon");
  });

  it("requires a title and positive target before a draft can be published", () => {
    const draft = draftFromLive(liveWedding, liveItems);
    expect(weddingDraftSchema.safeParse(draft).success).toBe(true);
    expect(weddingDraftSchema.safeParse({ ...draft, items: [{ ...draft.items[0]!, title: "" }] }).success).toBe(false);
    expect(weddingDraftSchema.safeParse({ ...draft, items: [{ ...draft.items[0]!, target: 0 }] }).success).toBe(false);
  });
});
