import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const publishWeddingDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { weddingId: string }) => z.object({ weddingId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("publish_wedding_draft", { _wedding_id: data.weddingId });
    if (error) throw new Error(error.message);
    return { published: true };
  });
