import { z } from "zod";

export const draftItemSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(["dream", "gift"]),
  title: z.string().trim().min(1, "Enter a title").max(200),
  category: z.string().max(200),
  description: z.string().max(6000),
  image_url: z.string().max(2000),
  target: z.number().int().min(1).max(2147483647),
});

export const weddingDraftSchema = z.object({
  details: z.object({
    names: z.string().trim().min(1, "Enter couple names").max(200),
    wedding_date: z.string().max(200),
    place: z.string().max(300),
    story: z.string().max(6000),
    cover_url: z.string().max(2000),
    published: z.boolean(),
  }),
  items: z.array(draftItemSchema).max(100),
});

export type DraftItem = z.infer<typeof draftItemSchema>;
export type WeddingDraft = z.infer<typeof weddingDraftSchema>;

export function draftFromLive(
  wedding: { names: string; wedding_date: string; place: string; story: string; cover_url: string; published: boolean },
  items: Array<{ id: string; kind: string; title: string; category: string; description: string; image_url: string; target: number }>,
): WeddingDraft {
  return {
    details: {
      names: wedding.names,
      wedding_date: wedding.wedding_date,
      place: wedding.place,
      story: wedding.story,
      cover_url: wedding.cover_url,
      published: wedding.published,
    },
    items: items.map((item) => ({
      id: item.id,
      kind: item.kind === "gift" ? "gift" : "dream",
      title: item.title,
      category: item.category,
      description: item.description,
      image_url: item.image_url,
      target: item.target,
    })),
  };
}
