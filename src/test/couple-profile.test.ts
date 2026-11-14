import { describe, expect, it } from "vitest";
import { coupleProfileSchema, safeSocialUrl } from "@/lib/couple-profile";

const validProfile = {
  display_name: "Aarav Sharma & Meera Shah",
  location: "Mumbai, India",
  instagram_url: "https://instagram.com/aaravandmeera",
  facebook_url: "https://facebook.com/aaravandmeera",
  website_url: "https://example.com/our-story",
};

describe("couple profile validation", () => {
  it("accepts real names, location, and web social links", () => {
    expect(coupleProfileSchema.parse(validProfile)).toEqual(validProfile);
  });

  it("allows optional location and social links to remain empty", () => {
    const result = coupleProfileSchema.parse({ ...validProfile, location: "", instagram_url: "", facebook_url: "", website_url: "" });
    expect(result.location).toBe("");
    expect(result.instagram_url).toBe("");
  });

  it("rejects non-web links that could execute script", () => {
    expect(safeSocialUrl("javascript:alert(1)")).toBe("");
    expect(coupleProfileSchema.safeParse({ ...validProfile, instagram_url: "javascript:alert(1)" }).success).toBe(false);
  });
});
