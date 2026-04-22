import type { ReactNode } from "react";
import { BarChart3, BookOpen, Heart, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "./AppShell.css";

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { to: "/view", label: "Library", Icon: BookOpen },
  { to: "/wishlist", label: "Wishlist", Icon: Heart },
  { to: "/admin", label: "Admin", Icon: Settings },
  { to: "/stats", label: "Stats", Icon: BarChart3 },
] as const;

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip To Content
      </a>

      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-brand" translate="no">
            <Link
              to="/view"
              className="app-brand__link"
              aria-label="Jenkins Library home"
            >
              <img
                src="/houselogo.png"
                alt="Jenkins Library"
                width="96"
                height="96"
                className="app-brand__logo"
              />
              <span className="app-brand__title">Jenkins Library</span>
            </Link>
          </div>

          <nav className="app-nav" aria-label="Primary navigation">
            {navItems.map(({ to, label, Icon }) => {
              const isActive = location.pathname === to;

              return (
                <Link
                  key={to}
                  to={to}
                  className="app-nav__link"
                  aria-current={isActive ? "page" : undefined}
                  data-active={isActive ? "true" : undefined}
                >
                  <Icon className="app-nav__icon" aria-hidden="true" size={18} />
                  <span className="app-nav__label">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main id="main-content" className="app-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
