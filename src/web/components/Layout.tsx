import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Машины" },
  { href: "/notifications", label: "История" },
  { href: "/filters", label: "Фильтры" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [loc] = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-6">
          <Link href="/" className="font-bold text-lg tracking-tight">
            E39 Hunter
          </Link>
          <nav className="flex gap-4 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "px-2 py-1 rounded transition-colors hover:text-primary",
                  loc === n.href ? "text-primary" : "text-muted-foreground",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
