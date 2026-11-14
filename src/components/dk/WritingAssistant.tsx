import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, LoaderCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { generateWeddingWriting } from "@/lib/wedding-writing.functions";
import type { WritingInput } from "@/lib/wedding-writing";

type Props = {
  weddingId: string; names: string; date: string; place: string;
  kind: "story" | "gift"; title?: string; existing: string;
  onApply: (text: string) => void | Promise<void>;
};

export function WritingAssistant(props: Props) {
  const generate = useServerFn(generateWeddingWriting);
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState("");
  const [tone, setTone] = useState<WritingInput["tone"]>("Heartfelt");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const isStory = props.kind === "story";

  async function write() {
    setBusy(true); setError("");
    try {
      const result = await generate({ data: { ...props, title: props.title ?? "", details, tone } });
      if (result.error) setError(result.error); else setDraft(result.text);
    } catch { setError("We couldn’t create a draft. Check your connection and sign-in, then try again."); }
    finally { setBusy(false); }
  }
  async function apply() {
    setApplying(true); setError("");
    try { await props.onApply(draft.trim()); setOpen(false); }
    catch { setError("Your draft couldn’t be applied. It’s still here for you to keep."); }
    finally { setApplying(false); }
  }

  return <>
    <Button type="button" variant="outline" size="sm" className="rounded-full" disabled={!props.names.trim() || (!isStory && !props.title?.trim())} onClick={() => setOpen(true)}>
      <Sparkles aria-hidden />{isStory ? "Write story with AI" : "Write description with AI"}
    </Button>
    <Dialog open={open} onOpenChange={(value) => { if (!busy && !applying) setOpen(value); }}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto bg-background sm:max-w-xl">
        <DialogHeader>
          <p className="eyebrow">A little inspiration</p>
          <DialogTitle className="font-serif text-3xl">{isStory ? "Your story, in your words" : props.title}</DialogTitle>
          <DialogDescription>{[props.names, props.date, props.place].filter(Boolean).join(" · ")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor={`details-${props.kind}`}>{isStory ? "How you met, favourite memories & shared dreams" : "Why this gift matters to you"}</Label>
          <Textarea id={`details-${props.kind}`} value={details} maxLength={4000} disabled={busy || applying} onChange={(e) => setDetails(e.target.value)} className="min-h-28" placeholder={isStory ? "We met at university. Our Sunday walks and love of travel brought us closer…" : "We love making coffee together and want to start our mornings in our new home…"} />
        </div>
        <fieldset disabled={busy || applying} className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Tone</legend>
          <div className="flex flex-wrap gap-2">
            {(["Heartfelt", "Playful", "Elegant"] as const).map((value) => <Button key={value} type="button" variant={tone === value ? "default" : "outline"} size="sm" aria-pressed={tone === value} onClick={() => setTone(value)}>{value}</Button>)}
          </div>
        </fieldset>
        <Button type="button" disabled={busy || applying || !details.trim()} onClick={write}>
          {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
          {busy ? "Writing your draft…" : draft ? "Generate another draft" : "Generate draft"}
        </Button>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {draft && <div className="space-y-3 border-t border-border pt-4">
          <Label htmlFor={`draft-${props.kind}`}>Your draft</Label>
          <Textarea id={`draft-${props.kind}`} value={draft} disabled={busy || applying} onChange={(e) => setDraft(e.target.value)} className="min-h-44 leading-relaxed" />
          <Button type="button" disabled={busy || applying || !draft.trim()} onClick={apply}><Check aria-hidden />{applying ? "Applying…" : "Use this draft"}</Button>
        </div>}
      </DialogContent>
    </Dialog>
  </>;
}