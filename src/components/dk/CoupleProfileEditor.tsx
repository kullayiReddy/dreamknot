import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { coupleProfileSchema, type CoupleProfileValues } from "@/lib/couple-profile";

export function CoupleProfileEditor({ weddingId, slug, fallbackName, published }: { weddingId: string; slug: string; fallbackName: string; published: boolean }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CoupleProfileValues>({
    display_name: fallbackName,
    location: "",
    instagram_url: "",
    facebook_url: "",
    website_url: "",
  });
  const profileQuery = useQuery({
    queryKey: ["couple-profile", weddingId],
    queryFn: async () => {
      const { data, error } = await supabase.from("couple_profiles").select("*").eq("wedding_id", weddingId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    const { display_name, location, instagram_url, facebook_url, website_url } = profileQuery.data;
    setForm({ display_name, location, instagram_url, facebook_url, website_url });
  }, [profileQuery.data]);

  function update(field: keyof CoupleProfileValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const parsed = coupleProfileSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your profile details");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("couple_profiles").upsert({
      wedding_id: weddingId,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    }, { onConflict: "wedding_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setForm(parsed.data);
    await queryClient.invalidateQueries({ queryKey: ["couple-profile", weddingId] });
    toast.success(published ? "Couple profile updated" : "Couple profile saved — publish the wedding to share it");
  }

  return (
    <form id="couple-profile" onSubmit={save} className="scroll-mt-24 space-y-5 rounded-2xl bg-card p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Public couple profile</p>
          <h2 className="mt-1 text-3xl">About you</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">Add your real names, location, and social links. Saving here updates your couple profile; guests can open it from your wedding page.</p>
        </div>
        {published && <Button asChild variant="ghost" size="sm"><Link to="/weddings/$slug/profile" params={{ slug }}>View profile</Link></Button>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="profile-name">Your real names</Label><Input id="profile-name" required value={form.display_name} onChange={(event) => update("display_name", event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="profile-location">Location</Label><Input id="profile-location" placeholder="City, country" value={form.location} onChange={(event) => update("location", event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="profile-instagram">Instagram link</Label><Input id="profile-instagram" type="url" placeholder="https://instagram.com/…" value={form.instagram_url} onChange={(event) => update("instagram_url", event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="profile-facebook">Facebook link</Label><Input id="profile-facebook" type="url" placeholder="https://facebook.com/…" value={form.facebook_url} onChange={(event) => update("facebook_url", event.target.value)} /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="profile-website">Website or another social link</Label><Input id="profile-website" type="url" placeholder="https://…" value={form.website_url} onChange={(event) => update("website_url", event.target.value)} /></div>
      </div>
      {profileQuery.isError && <p role="alert" className="text-sm text-destructive">Your saved profile could not be loaded. Check your connection before saving.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">{published ? "This profile is visible to wedding guests." : "This profile becomes public when the wedding is published."}</p>
        <Button type="submit" className="rounded-full" disabled={saving || profileQuery.isLoading}>{saving ? "Saving…" : "Save couple profile"}</Button>
      </div>
    </form>
  );
}
