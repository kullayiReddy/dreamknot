import { describe, it, expect } from "vitest";
import { assertWeddingOwner, writingSchema, makeWritingRequest } from "@/lib/wedding-writing";

describe("Personalized wedding writing", () => {
  it("rejects writing for another couple’s wedding", () => {
    expect(() => assertWeddingOwner("couple-a", "couple-b")).toThrow();
    expect(() => assertWeddingOwner("couple-a", "couple-a")).not.toThrow();
  });
  it("requires wedding details for personalized stories", () => {
    const data = { weddingId: "00000000-0000-4000-8000-000000000001", kind: "story", names: "Maya & Dev", date: "", place: "", details: "", tone: "Heartfelt", title: "", existing: "" };
    expect(writingSchema.safeParse(data).success).toBe(false);
    expect(writingSchema.safeParse({ ...data, details: "We met in college" }).success).toBe(true);
  });
  it("requires the selected gift title for personalized descriptions", () => {
    const data = { weddingId: "00000000-0000-4000-8000-000000000001", kind: "gift", names: "Maya & Dev", date: "", place: "", details: "We love coffee", tone: "Heartfelt", title: "", existing: "" };
    expect(writingSchema.safeParse(data).success).toBe(false);
    expect(writingSchema.safeParse({ ...data, title: "Coffee machine" }).success).toBe(true);
  });
  it("sends wedding details and the selected tone without serializing UI callbacks", () => {
    const props = { weddingId: "00000000-0000-4000-8000-000000000001", kind: "story" as const, names: "Maya & Dev", date: "14 February 2027", place: "Jaipur", existing: "Our original story", onApply: () => {} };
    const request = makeWritingRequest(props, "We met at university", "Playful");
    expect(JSON.parse(JSON.stringify(request))).toEqual({ weddingId: props.weddingId, kind: "story", names: "Maya & Dev", date: "14 February 2027", place: "Jaipur", existing: "Our original story", title: "", details: "We met at university", tone: "Playful" });
    expect(request).not.toHaveProperty("onApply");
  });
});