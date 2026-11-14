import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writingSchema, writingInstructions, assertWeddingOwner } from "./wedding-writing";

export const generateWeddingWriting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => writingSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ text: string; error: string | null }> => {
    const { data: wedding, error } = await context.supabase.from("weddings")
      .select("owner_id").eq("id", data.weddingId).single();
    assertWeddingOwner(error ? undefined : wedding?.owner_id, context.userId);
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    try {
      const response = await generateResponse({
        model: "openai/gpt-6-astra",
        reasoning: { effort: "low" },
        instructions: writingInstructions(data.kind),
        input: JSON.stringify({ names: data.names, weddingDate: data.date, place: data.place, personalDetails: data.details, tone: data.tone, giftTitle: data.title, currentDraft: data.existing }),
      });
      const messages = response.output.filter((item) => item.type === "message");
      if (messages.some((message) => message.content.some((part) => part.type === "refusal"))) {
        return { text: "", error: "The AI couldn’t write from these details. Please revise them before trying again." };
      }
      const text = messages.flatMap((message) => message.content.flatMap((part) => part.type === "output_text" ? [part.text] : [])).join("\n").trim();
      if (response.status !== "completed" || !text) return { text: "", error: "The draft wasn’t completed. Your details are still here." };
      return { text, error: null };
    } catch (error) {
      if (error instanceof GatewayError) {
        console.error("Wedding writing failed", { code: error.code, outcome: error.outcome, ids: error.ids });
        if (error.code === "payment_required") return { text: "", error: "AI writing is paused until the app owner adds AI credits." };
        if (error.code === "permission_denied") return { text: "", error: "AI writing is unavailable under the workspace’s current AI permissions." };
        if (error.code === "rate_limited") return { text: "", error: "AI writing is busy. Please wait before requesting another draft." };
        if (error.outcome === "unknown") return { text: "", error: "We couldn’t confirm whether the draft finished. Your details are preserved; no automatic retry was made." };
      }
      return { text: "", error: "AI writing is unavailable right now. Your details and existing text are unchanged." };
    }
  });