import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import "./AppShell.css";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-warm-gray bg-cream shadow-soft backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              <img
                src="/houselogo.png"
                alt="Jenkins Library"
                className="h-24"
              />
              <h1 className="font-display text-2xl font-bold tracking-tight text-charcoal">
                Jenkins Library
              </h1>
            </div>
          </div>
          <nav className="flex gap-4 border-t border-warm-gray py-3">
            <Link
              to="/view"
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                location.pathname === "/view"
                  ? "bg-warm-gray-light text-charcoal"
                  : "text-charcoal/70 hover:text-charcoal hover:bg-warm-gray-light/60"
              }`}
            >
              Library
            </Link>
            <Link
              to="/admin"
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                location.pathname === "/admin"
                  ? "bg-warm-gray-light text-charcoal"
                  : "text-charcoal/70 hover:text-charcoal hover:bg-warm-gray-light/60"
              }`}
            >
              Admin
            </Link>
            <Link
              to="/stats"
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                location.pathname === "/stats"
                  ? "bg-warm-gray-light text-charcoal"
                  : "text-charcoal/70 hover:text-charcoal hover:bg-warm-gray-light/60"
              }`}
            >
              Stats
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 text-charcoal">
        {children}
      </main>
    </div>
  );
}
