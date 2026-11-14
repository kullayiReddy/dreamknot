import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-foreground">
      <svg viewBox="0 0 40 24" className="h-6 w-10 text-gold" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M4 12c0-5 4-8 8-8s6 3 8 8 4 8 8 8 8-3 8-8-4-8-8-8-6 3-8 8-4 8-8 8-8-3-8-8z" />
      </svg>
      <span className="font-serif text-2xl tracking-wide">DreamKnot</span>
    </Link>
  );
}

const nav = [
  { to: "/how-it-works", label: "How It Works" },
  { to: "/explore", label: "Explore Weddings" },
  { to: "/pricing", label: "Pricing" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm" className="rounded-full px-5">
          <Link to="/weddings/$slug" params={{ slug: "aarav-and-meera" }}>See a sample page</Link>
        </Button>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">Tie Dreams. Gift Together.</p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          {nav.map((n) => <Link key={n.to} to={n.to} className="hover:text-foreground">{n.label}</Link>)}
        </div>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} DreamKnot</p>
      </div>
    </footer>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${value}%` }} />
    </div>
  );
}

export function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-4xl md:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-muted-foreground">{sub}</p>}
    </div>
  );
}
