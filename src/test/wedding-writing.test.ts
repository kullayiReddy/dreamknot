import { describe, it, expect } from "vitest";
import { assertWeddingOwner, writingSchema } from "@/lib/wedding-writing";

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
});