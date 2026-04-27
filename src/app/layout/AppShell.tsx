import type { ComponentType, ReactNode } from "react";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  BookOpenText,
  Heart,
  Plus,
  Settings,
  Search,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "./AppShell.css";

interface AppShellProps {
  children: ReactNode;
}

const primaryNavItems = [
  { to: "/view", label: "Library", Icon: BookOpen },
  { to: "/wishlist", label: "Wishlist", Icon: Heart },
  { to: "/admin", label: "Manage", Icon: Settings },
  { to: "/stats", label: "Stats", Icon: BarChart3 },
] as const;

const secondaryNavItems = [
  { to: "/search", label: "Search", Icon: Search },
  { to: "/series", label: "Series", Icon: BookOpenText },
  { to: "/genres", label: "Genres", Icon: Sparkles },
  { to: "/reading-list", label: "TBR", Icon: BookMarked },
] as const;

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeOwnership =
    location.pathname === "/wishlist" ||
    searchParams.get("ownership") === "wishlist"
      ? "wishlist"
      : "owned";
  const addBookPath = `/admin?add=1&ownership=${activeOwnership}`;
  const getNavTarget = (to: string) =>
    to === location.pathname ? `${to}${location.search}` : to;

  const renderNavLink = (
    to: string,
    label: string,
    Icon: ComponentType<{ className?: string; size?: number; "aria-hidden"?: boolean }>,
    className: string,
  ) => {
    const isActive = location.pathname === to;

    return (
      <Link
        key={to}
        to={getNavTarget(to)}
        className={className}
        aria-current={isActive ? "page" : undefined}
        data-active={isActive ? "true" : undefined}
      >
        <Icon className="app-nav__icon" aria-hidden={true} size={18} />
        <span className="app-nav__label">{label}</span>
      </Link>
    );
  };

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

          <div className="app-header__navs">
            <nav className="app-nav" aria-label="Primary navigation">
              {primaryNavItems.map(({ to, label, Icon }) =>
                renderNavLink(to, label, Icon, "app-nav__link"),
              )}
            </nav>
            <nav className="app-nav app-nav--secondary" aria-label="Browse navigation">
              {secondaryNavItems.map(({ to, label, Icon }) =>
                renderNavLink(to, label, Icon, "app-nav__link app-nav__link--secondary"),
              )}
            </nav>
          </div>
        </div>
      </header>

      <main id="main-content" className="app-main" tabIndex={-1}>
        {children}
      </main>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {primaryNavItems.map(({ to, label, Icon }) =>
          renderNavLink(to, label, Icon, "mobile-bottom-nav__link"),
        )}
        <Link to={addBookPath} className="mobile-bottom-nav__add">
          <Plus aria-hidden="true" size={22} />
          <span>Add</span>
        </Link>
      </nav>

      <Link
        to={addBookPath}
        className="floating-add"
        aria-label="Add a book"
        title="Add a book"
      >
        <Plus aria-hidden="true" size={24} />
      </Link>
    </div>
  );
}
