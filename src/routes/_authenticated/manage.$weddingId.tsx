import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProgressBar } from "@/components/dk/Site";
import { PaymentAdmin, type AdminContribution, type AdminRefund } from "@/components/dk/PaymentAdmin";
import { WritingAssistant } from "@/components/dk/WritingAssistant";
import { draftFromLive, weddingDraftSchema, type DraftItem, type WeddingDraft } from "@/lib/wedding-admin";
import { publishWeddingDraft } from "@/lib/wedding-admin.functions";
import { formatINR, pct } from "@/lib/demo";

export const Route = createFileRoute("/_authenticated/manage/$weddingId")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Couple admin — DreamKnot" }, { name: "description", content: "Privately draft and publish your wedding page, review payments, and manage refunds." }, { property: "og:title", content: "Couple admin — DreamKnot" }, { property: "og:description", content: "Privately manage your wedding page and contributions." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex, follow" }] }),
  component: Manage,
});

const blankItem: { kind: "dream" | "gift"; title: string; category: string; description: string; image_url: string; target: string } = { kind: "dream", title: "", category: "", description: "", image_url: "", target: "" };

function Manage() {
  const { weddingId } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const publish = useServerFn(publishWeddingDraft);
  const [draft, setDraft] = useState<WeddingDraft | null>(null);
  const [newItem, setNewItem] = useState(blankItem);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const pageQuery = useQuery({
    queryKey: ["wedding-admin", weddingId],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const [wedding, items, savedDraft] = await Promise.all([
        supabase.from("weddings").select("*").eq("id", weddingId).single(),
        supabase.from("items").select("*").eq("wedding_id", weddingId).eq("archived", false).order("created_at"),
        supabase.from("wedding_drafts").select("payload, updated_at").eq("wedding_id", weddingId).maybeSingle(),
      ]);
      if (wedding.error) throw wedding.error;
      if (items.error) throw items.error;
      if (savedDraft.error) throw savedDraft.error;
      return { wedding: wedding.data, items: items.data ?? [], savedDraft: savedDraft.data };
    },
  });
  const paymentQuery = useQuery({
    queryKey: ["wedding-payments", weddingId],
    queryFn: async () => {
      const [contributions, refunds] = await Promise.all([
        supabase.from("contributions").select("id, guest_name, amount, message, status, created_at, paid_at, provider_payment_id, review_note, reviewed_at, items(title)").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
        supabase.from("refunds").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
      ]);
      if (contributions.error) throw contributions.error;
      if (refunds.error) throw refunds.error;
      const mapped: AdminContribution[] = (contributions.data ?? []).map((contribution) => ({
        id: contribution.id,
        guest_name: contribution.guest_name,
        amount: contribution.amount,
        message: contribution.message,
        status: contribution.status,
        created_at: contribution.created_at,
        paid_at: contribution.paid_at,
        provider_payment_id: contribution.provider_payment_id,
        review_note: contribution.review_note,
        reviewed_at: contribution.reviewed_at,
        itemTitle: (contribution as any).items?.title ?? "Gift",
      }));
      return { contributions: mapped, refunds: (refunds.data ?? []) as AdminRefund[] };
    },
    refetchInterval: (query) => query.state.data?.contributions.some((contribution) => contribution.status === "pending") || query.state.data?.refunds.some((refund) => ["initiating", "pending"].includes(refund.status)) ? 5000 : false,
  });

  const liveDraft = useMemo(() => pageQuery.data ? draftFromLive(pageQuery.data.wedding, pageQuery.data.items) : null, [pageQuery.data]);
  const savedDraft = useMemo(() => {
    if (!liveDraft) return null;
    const parsed = weddingDraftSchema.safeParse(pageQuery.data?.savedDraft?.payload);
    return parsed.success ? parsed.data : liveDraft;
  }, [liveDraft, pageQuery.data?.savedDraft]);
  useEffect(() => { if (savedDraft) setDraft(savedDraft); }, [savedDraft]);

  if (pageQuery.isLoading || !draft || !liveDraft || !savedDraft) return <p className="p-16 text-center text-muted-foreground">Loading couple admin…</p>;
  if (!pageQuery.data) return <p className="p-16 text-center">Wedding not found.</p>;

  const { wedding, items } = pageQuery.data;
  const payments = paymentQuery.data ?? { contributions: [], refunds: [] };
  const dirty = JSON.stringify(draft) !== JSON.stringify(savedDraft);
  const unpublished = JSON.stringify(draft) !== JSON.stringify(liveDraft);
  const confirmed = payments.contributions.filter((contribution) => contribution.status === "paid");
  const refundTotal = payments.refunds.filter((refund) => ["pending", "processed"].includes(refund.status)).reduce((sum, refund) => sum + refund.amount, 0);
  const received = confirmed.reduce((sum, contribution) => sum + contribution.amount, 0) - refundTotal;

  function updateDetails(patch: Partial<WeddingDraft["details"]>) {
    setDraft((current) => current ? { ...current, details: { ...current.details, ...patch } } : current);
  }
  function updateItem(id: string, patch: Partial<DraftItem>) {
    setDraft((current) => current ? { ...current, items: current.items.map((item) => item.id === id ? { ...item, ...patch } : item) } : current);
  }
  function addItem(event: React.FormEvent) {
    event.preventDefault();
    const target = Number(newItem.target);
    if (!newItem.title.trim() || !Number.isInteger(target) || target < 1) { toast.error("Enter a title and a valid target amount"); return; }
    const item: DraftItem = { id: crypto.randomUUID(), kind: newItem.kind, title: newItem.title.trim(), category: newItem.category, description: newItem.description, image_url: newItem.image_url, target };
    setDraft((current) => current ? { ...current, items: [...current.items, item] } : current);
    setNewItem(blankItem);
    toast.success("Added to your private draft");
  }
  function removeItem(id: string) {
    if (!confirm("Remove this from your draft? The public page changes only when you publish.")) return;
    setDraft((current) => current ? { ...current, items: current.items.filter((item) => item.id !== id) } : current);
  }
  async function saveDraft(quiet = false) {
    const parsed = weddingDraftSchema.safeParse(draft);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Check your draft"); return false; }
    setSaving(true);
    const { error } = await supabase.from("wedding_drafts").upsert({ wedding_id: weddingId, payload: parsed.data as unknown as Json, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) { toast.error(error.message); return false; }
    setDraft(parsed.data);
    await qc.invalidateQueries({ queryKey: ["wedding-admin", weddingId] });
    if (!quiet) toast.success("Private draft saved — your public page is unchanged");
    return true;
  }
  async function publishDraft() {
    if (!await saveDraft(true)) return;
    setPublishing(true);
    try {
      await publish({ data: { weddingId } });
      await Promise.all([qc.invalidateQueries({ queryKey: ["wedding-admin", weddingId] }), qc.invalidateQueries({ queryKey: ["my-weddings"] })]);
      toast.success("Changes published to your wedding page");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Your draft could not be published"); }
    finally { setPublishing(false); }
  }
  async function resetDraft() {
    if (!confirm("Discard all unpublished changes and restore the live page content?")) return;
    const { error } = await supabase.from("wedding_drafts").delete().eq("wedding_id", weddingId);
    if (error) { toast.error(error.message); return; }
    setDraft(liveDraft);
    await qc.invalidateQueries({ queryKey: ["wedding-admin", weddingId] });
    toast.success("Unpublished changes discarded");
  }
  async function removeWedding() {
    if (!confirm("Delete this wedding page and its contribution records permanently? This does not automatically issue refunds.")) return;
    const { error } = await supabase.from("weddings").delete().eq("id", weddingId);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: ["my-weddings"] });
    navigate({ to: "/dashboard" });
  }

  return (
    <section className="mx-auto max-w-5xl space-y-10 px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← All pages</Link>
          <p className="eyebrow mt-5">Couple admin</p>
          <h1 className="mt-2 text-5xl">{draft.details.names}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{dirty ? "Unsaved private changes" : unpublished ? "Draft saved · not yet public" : "Your draft matches the live page"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {wedding.published && <Button asChild variant="ghost" className="rounded-full"><Link to="/weddings/$slug" params={{ slug: wedding.slug }}>View live page</Link></Button>}
          <Button type="button" variant="outline" className="rounded-full" disabled={!dirty || saving || publishing} onClick={() => saveDraft()}>{saving ? "Saving…" : "Save draft"}</Button>
          <Button type="button" className="rounded-full" disabled={!unpublished || saving || publishing} onClick={publishDraft}>{publishing ? "Publishing…" : "Publish changes"}</Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gold/30 bg-card p-5 text-sm leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Private by default.</span> Edit details, stories, dreams, and gifts here without changing what guests see. Save your draft, then choose “Publish changes” when you are ready.
      </div>

      <nav aria-label="Couple admin sections" className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><a href="#page-editor">Page editor</a></Button>
        <Button asChild variant="outline" size="sm"><a href="#payment-admin">Payments & refunds</a></Button>
      </nav>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Net received" value={formatINR(received)} />
        <Stat label="Confirmed payments" value={String(confirmed.length)} />
        <Stat label="Live items" value={String(items.length)} />
      </div>

      <div id="page-editor" className="scroll-mt-24 space-y-4 rounded-2xl bg-card p-6 shadow-soft">
        <div><p className="eyebrow">Private draft</p><h2 className="mt-1 text-3xl">Page details & story</h2></div>
        <div className="space-y-2"><Label htmlFor="couple-names">Couple names</Label><Input id="couple-names" value={draft.details.names} onChange={(event) => updateDetails({ names: event.target.value })} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="wedding-date">Wedding date</Label><Input id="wedding-date" placeholder="14 February 2027" value={draft.details.wedding_date} onChange={(event) => updateDetails({ wedding_date: event.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="wedding-place">Place</Label><Input id="wedding-place" value={draft.details.place} onChange={(event) => updateDetails({ place: event.target.value })} /></div>
        </div>
        <div className="space-y-2"><Label htmlFor="cover-url">Cover photo link</Label><Input id="cover-url" placeholder="https://…" value={draft.details.cover_url} onChange={(event) => updateDetails({ cover_url: event.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="wedding-story">Your story</Label><Textarea id="wedding-story" className="min-h-40" value={draft.details.story} onChange={(event) => updateDetails({ story: event.target.value })} /></div>
        <WritingAssistant weddingId={weddingId} names={draft.details.names} date={draft.details.wedding_date} place={draft.details.place} kind="story" existing={draft.details.story} onApply={(story) => updateDetails({ story })} />
        <label className="flex items-center gap-3 text-sm"><Switch checked={draft.details.published} onCheckedChange={(published) => updateDetails({ published })} /> Make the page visible to guests when these changes are published</label>
        <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => saveDraft()} disabled={!dirty || saving}>Save private draft</Button>
          <div className="flex gap-2"><Button type="button" variant="ghost" disabled={!unpublished || saving || publishing} onClick={resetDraft}>Discard changes</Button><Button type="button" variant="ghost" onClick={removeWedding} className="text-destructive">Delete page</Button></div>
        </div>
      </div>

      <div className="space-y-5 rounded-2xl bg-card p-6 shadow-soft">
        <div><p className="eyebrow">Private draft</p><h2 className="mt-1 text-3xl">Dreams & gifts</h2><p className="mt-2 text-sm text-muted-foreground">Every edit, addition, and removal stays private until you publish.</p></div>
        {draft.items.map((item, index) => {
          const liveItem = items.find((candidate) => candidate.id === item.id);
          return <div key={item.id} className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3"><p className="eyebrow">Item {index + 1}{liveItem ? "" : " · New"}</p><Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.id)}>Remove from draft</Button></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor={`kind-${item.id}`}>Type</Label><select id={`kind-${item.id}`} value={item.kind} onChange={(event) => updateItem(item.id, { kind: event.target.value as DraftItem["kind"] })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="dream">Dream experience</option><option value="gift">Group gift</option></select></div>
              <div className="space-y-2"><Label htmlFor={`title-${item.id}`}>Title</Label><Input id={`title-${item.id}`} value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor={`category-${item.id}`}>Category</Label><Input id={`category-${item.id}`} value={item.category} onChange={(event) => updateItem(item.id, { category: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor={`target-${item.id}`}>Target (₹)</Label><Input id={`target-${item.id}`} type="number" min={1} value={item.target || ""} onChange={(event) => updateItem(item.id, { target: Number(event.target.value) })} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor={`image-${item.id}`}>Image link</Label><Input id={`image-${item.id}`} value={item.image_url} onChange={(event) => updateItem(item.id, { image_url: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor={`description-${item.id}`}>Description</Label><Textarea id={`description-${item.id}`} value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} /></div>
            <WritingAssistant weddingId={weddingId} names={draft.details.names} date={draft.details.wedding_date} place={draft.details.place} kind="gift" title={item.title} existing={item.description} onApply={(description) => updateItem(item.id, { description })} />
            {liveItem && <div><ProgressBar value={pct(liveItem.raised, liveItem.target)} /><p className="mt-1 text-xs text-muted-foreground">{formatINR(liveItem.raised)} currently received · {liveItem.contributors} contributors</p></div>}
          </div>;
        })}
        {draft.items.length === 0 && <p className="text-sm text-muted-foreground">No dreams or gifts in this draft.</p>}

        <form onSubmit={addItem} className="grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
          <h3 className="text-2xl sm:col-span-2">Add to the draft</h3>
          <select aria-label="New item type" value={newItem.kind} onChange={(event) => setNewItem({ ...newItem, kind: event.target.value as "dream" | "gift" })} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="dream">Dream experience</option><option value="gift">Group gift</option></select>
          <Input required aria-label="New item title" placeholder="Title" value={newItem.title} onChange={(event) => setNewItem({ ...newItem, title: event.target.value })} />
          <Input aria-label="New item category" placeholder="Category" value={newItem.category} onChange={(event) => setNewItem({ ...newItem, category: event.target.value })} />
          <Input required aria-label="New item target" type="number" min={1} placeholder="Target (₹)" value={newItem.target} onChange={(event) => setNewItem({ ...newItem, target: event.target.value })} />
          <Input aria-label="New item image" placeholder="Image link (optional)" value={newItem.image_url} onChange={(event) => setNewItem({ ...newItem, image_url: event.target.value })} />
          <Textarea aria-label="New item description" placeholder="Short description" value={newItem.description} onChange={(event) => setNewItem({ ...newItem, description: event.target.value })} />
          <div className="sm:col-span-2"><WritingAssistant weddingId={weddingId} names={draft.details.names} date={draft.details.wedding_date} place={draft.details.place} kind="gift" title={newItem.title} existing={newItem.description} onApply={(description) => setNewItem((current) => ({ ...current, description }))} /></div>
          <Button type="submit" variant="outline" className="rounded-full sm:col-span-2">Add to private draft</Button>
        </form>
      </div>

      {paymentQuery.isLoading ? <p className="text-center text-muted-foreground">Loading payments…</p> : <PaymentAdmin contributions={payments.contributions} refunds={payments.refunds} onChanged={() => qc.invalidateQueries({ queryKey: ["wedding-payments", weddingId] })} />}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-card p-6 shadow-soft"><p className="eyebrow">{label}</p><p className="mt-2 font-serif text-4xl">{value}</p></div>;
}
