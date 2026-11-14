import { z } from "zod";

export function safeSocialUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? trimmed : "";
  } catch {
    return "";
  }
}

const socialUrl = z.string().trim().max(2000, "Keep links under 2,000 characters").refine(
  (value) => !value || Boolean(safeSocialUrl(value)),
  "Enter a complete web address starting with https://",
);

export const coupleProfileSchema = z.object({
  display_name: z.string().trim().min(1, "Enter your real names").max(200, "Keep names under 200 characters"),
  location: z.string().trim().max(300, "Keep location under 300 characters"),
  instagram_url: socialUrl,
  facebook_url: socialUrl,
  website_url: socialUrl,
});

export type CoupleProfileValues = z.infer<typeof coupleProfileSchema>;
