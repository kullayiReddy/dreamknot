import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — DreamKnot" },
      { name: "description", content: "Sign in or create your DreamKnot couple account." },
      { property: "og:title", content: "Sign in — DreamKnot" },
      { property: "og:description", content: "Create and manage your wedding gifting page." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/dashboard" }); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (s && e === "SIGNED_IN") navigate({ to: "/dashboard" }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = mode === "up"
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/auth" } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (res.error) { toast.error(res.error.message); return; }
    if (mode === "up" && !res.data.session) setSent(true);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Google sign-in failed");
  }

  return (
    <section className="mx-auto max-w-md px-6 py-20">
      <p className="eyebrow text-center">For couples</p>
      <h1 className="mt-2 text-center text-5xl">{mode === "up" ? "Create your page" : "Welcome back"}</h1>
      {sent ? (
        <p className="mt-10 rounded-2xl bg-card p-6 text-center shadow-soft">Check {email} for a confirmation link, then come back to sign in.</p>
      ) : (
        <div className="mt-10 space-y-4 rounded-2xl bg-card p-8 shadow-soft">
          <button type="button" onClick={google} className="flex w-full items-center justify-center gap-[10px] rounded-full border border-[#747775] bg-[#FFFFFF] px-3 py-2.5 text-sm font-medium text-[#1F1F1F]">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
            Continue with Google
          </button>
          <div className="text-center text-xs text-muted-foreground">or</div>
          <form onSubmit={submit} className="space-y-3">
            <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" disabled={busy} className="w-full rounded-full">{mode === "up" ? "Sign up" : "Sign in"}</Button>
          </form>
          <button type="button" onClick={() => setMode(mode === "up" ? "in" : "up")} className="w-full text-sm text-muted-foreground hover:text-foreground">
            {mode === "up" ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>
      )}
    </section>
  );
}
