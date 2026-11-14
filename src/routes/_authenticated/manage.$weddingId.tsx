import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ProgressBar } from "@/components/dk/Site";
import { formatINR, pct } from "@/lib/demo";

export const Route = createFileRoute("/_authenticated/manage/$weddingId")({
  head: () => ({ meta: [{ title: "Manage wedding — DreamKnot" }, { name: "description", content: "Edit your wedding page, dreams and gifts." }, { property: "og:title", content: "Manage wedding — DreamKnot" }, { property: "og:description", content: "Edit your wedding page." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Manage,
});

function Manage() {
  const { weddingId } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["wedding", weddingId],
    queryFn: async () => {
      const [w, items, contribs] = await Promise.all([
        supabase.from("weddings").select("*").eq("id", weddingId).single(),
        supabase.from("items").select("*").eq("wedding_id", weddingId).order("created_at"),
        supabase.from("contributions").select("id, guest_name, amount, message, status, created_at, items(title)").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
      ]);
      if (w.error) throw w.error;
      return { wedding: w.data, items: items.data ?? [], contribs: contribs.data ?? [] };
    },
  });
  const [form, setForm] = useState({ names: "", wedding_date: "", place: "", story: "", cover_url: "", published: false });
  useEffect(() => { if (q.data) { const w = q.data.wedding; setForm({ names: w.names, wedding_date: w.wedding_date, place: w.place, story: w.story, cover_url: w.cover_url, published: w.published }); } }, [q.data]);
  const [item, setItem] = useState({ kind: "dream", title: "", category: "", description: "", image_url: "", target: "" });
  const refresh = () => qc.invalidateQueries({ queryKey: ["wedding", weddingId] });

  if (q.isLoading) return <p className="p-16 text-center text-muted-foreground">Loading…</p>;
  if (!q.data) return <p className="p-16 text-center">Wedding not found.</p>;
  const { wedding, items, contribs } = q.data;
  const paid = contribs.filter((c) => c.status === "paid");

  async function save() {
    const { error } = await supabase.from("weddings").update(form).eq("id", weddingId);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved"); refresh();
  }
  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const target = Number(item.target);
    if (!target || target < 1) { toast.error("Enter a target amount"); return; }
    const { error } = await supabase.from("items").insert({ ...item, target, wedding_id: weddingId });
    if (error) { toast.error(error.message); return; }
    setItem({ kind: "dream", title: "", category: "", description: "", image_url: "", target: "" }); refresh();
  }
  async function removeItem(id: string) {
    if (!confirm("Remove this item?")) return;
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }
  async function removeWedding() {
    if (!confirm("Delete this wedding page permanently?")) return;
    await supabase.from("weddings").delete().eq("id", weddingId);
    qc.invalidateQueries({ queryKey: ["my-weddings"] });
    navigate({ to: "/dashboard" });
  }

  return (
    <section className="mx-auto max-w-5xl space-y-10 px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← All pages</Link>
          <h1 className="mt-2 text-5xl">{wedding.names}</h1>
        </div>
        {wedding.published && <Button asChild variant="outline" className="rounded-full"><Link to="/weddings/$slug" params={{ slug: wedding.slug }}>View live page</Link></Button>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Received" value={formatINR(paid.reduce((s, c) => s + c.amount, 0))} />
        <Stat label="Contributions" value={String(paid.length)} />
        <Stat label="Items" value={String(items.length)} />
      </div>

      <div className="space-y-3 rounded-2xl bg-card p-6 shadow-soft">
        <h2 className="text-3xl">Page details</h2>
        <Input placeholder="Couple names" value={form.names} onChange={(e) => setForm({ ...form, names: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Date, e.g. 14 February 2027" value={form.wedding_date} onChange={(e) => setForm({ ...form, wedding_date: e.target.value })} />
          <Input placeholder="Place" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} />
        </div>
        <Input placeholder="Cover photo link (https://…)" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} />
        <Textarea placeholder="Your story" value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} />
        <label className="flex items-center gap-3 text-sm"><Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} /> Published (guests can see it)</label>
        <div className="flex justify-between">
          <Button onClick={save} className="rounded-full">Save</Button>
          <Button variant="ghost" onClick={removeWedding} className="text-destructive">Delete page</Button>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl bg-card p-6 shadow-soft">
        <h2 className="text-3xl">Dreams & gifts</h2>
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-4 border-b border-border pb-4">
            <div className="flex-1">
              <p className="eyebrow">{i.kind === "dream" ? "Dream" : "Gift"} {i.category && `· ${i.category}`}</p>
              <p className="text-xl">{i.title}</p>
              <div className="mt-2"><ProgressBar value={pct(i.raised, i.target)} /></div>
              <p className="mt-1 text-xs text-muted-foreground">{formatINR(i.raised)} of {formatINR(i.target)} · {i.contributors} contributors</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeItem(i.id)}>Remove</Button>
          </div>
        ))}
        <form onSubmit={addItem} className="grid gap-3 sm:grid-cols-2">
          <select value={item.kind} onChange={(e) => setItem({ ...item, kind: e.target.value })} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="dream">Dream experience</option>
            <option value="gift">Group gift</option>
          </select>
          <Input required placeholder="Title" value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} />
          <Input placeholder="Category" value={item.category} onChange={(e) => setItem({ ...item, category: e.target.value })} />
          <Input required type="number" min={1} placeholder="Target (₹)" value={item.target} onChange={(e) => setItem({ ...item, target: e.target.value })} />
          <Input placeholder="Image link (optional)" value={item.image_url} onChange={(e) => setItem({ ...item, image_url: e.target.value })} />
          <Input placeholder="Short description" value={item.description} onChange={(e) => setItem({ ...item, description: e.target.value })} />
          <Button type="submit" variant="outline" className="rounded-full sm:col-span-2">Add item</Button>
        </form>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-soft">
        <h2 className="text-3xl">Contributions</h2>
        {contribs.length === 0 ? <p className="mt-3 text-muted-foreground">No contributions yet.</p> : (
          <ul className="mt-4 divide-y divide-border">
            {contribs.map((c) => (
              <li key={c.id} className="flex justify-between gap-4 py-3 text-sm">
                <div><p className="font-medium">{c.guest_name} · {(c as any).items?.title}</p>{c.message && <p className="text-muted-foreground">“{c.message}”</p>}</div>
                <div className="text-right"><p>{formatINR(c.amount)}</p><p className={`text-xs ${c.status === "paid" ? "text-gold" : "text-muted-foreground"}`}>{c.status}</p></div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-card p-6 shadow-soft"><p className="eyebrow">{label}</p><p className="mt-2 font-serif text-4xl">{value}</p></div>;
}
