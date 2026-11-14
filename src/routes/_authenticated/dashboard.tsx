import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentPayoutInfo } from "@/components/dk/PaymentPayoutInfo";

export const Route = createFileRoute("/_authenticated/dashboard")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Your weddings — DreamKnot" }, { name: "description", content: "Manage your DreamKnot wedding pages." }, { property: "og:title", content: "Dashboard — DreamKnot" }, { property: "og:description", content: "Manage your wedding pages." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex, follow" }] }),
  component: Dashboard,
});

const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function Dashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [names, setNames] = useState("");
  const { data: weddings = [] } = useQuery({
    queryKey: ["my-weddings"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("weddings").select("id, slug, names, wedding_date, published").eq("owner_id", u.user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const base = slugify(names) || "wedding";
    const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase.from("weddings").insert({ names, slug }).select("id").single();
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["my-weddings"] });
    navigate({ to: "/manage/$weddingId", params: { weddingId: data.id } });
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <p className="eyebrow">Dashboard</p>
      <h1 className="mt-2 text-5xl">Your wedding pages</h1>
      <form onSubmit={create} className="mt-10 flex gap-3 rounded-2xl bg-card p-6 shadow-soft">
        <Input required placeholder="Couple names, e.g. Aarav & Meera" value={names} onChange={(e) => setNames(e.target.value)} />
        <Button type="submit" className="rounded-full">Create page</Button>
      </form>
      <div className="mt-8"><PaymentPayoutInfo /></div>
      <div className="mt-8 space-y-3">
        {weddings.length === 0 && <p className="text-muted-foreground">No pages yet — create your first above.</p>}
        {weddings.map((w) => (
          <Link key={w.id} to="/manage/$weddingId" params={{ weddingId: w.id }} className="flex items-center justify-between rounded-2xl bg-card p-6 shadow-soft hover:shadow-md">
            <div>
              <h2 className="text-2xl">{w.names}</h2>
              <p className="text-sm text-muted-foreground">/{w.slug} {w.wedding_date && `· ${w.wedding_date}`}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs ${w.published ? "bg-gold text-foreground" : "bg-muted text-muted-foreground"}`}>{w.published ? "Live" : "Draft"}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
