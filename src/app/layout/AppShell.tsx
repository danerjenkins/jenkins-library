import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { AppNavigation, MobileAppNavigation } from "./AppNavigation";
import "./AppShell.css";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isFullBleedPage = new Set([
    "/view",
    "/wishlist",
    "/quick-read",
    "/series",
    "/genres",
    "/search",
    "/stats",
    "/reading-list",
  ]).has(location.pathname);
  const activeOwnership =
    location.pathname === "/wishlist" ||
    searchParams.get("ownership") === "wishlist"
      ? "wishlist"
      : "owned";
  const addBookPath = `/admin?add=1&ownership=${activeOwnership}`;

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
          <AppNavigation />
        </div>
      </header>

      <main
        id="main-content"
        className={`app-main ${isFullBleedPage ? "app-main--full-bleed" : ""}`}
        tabIndex={-1}
      >
        {children}
      </main>

      <MobileAppNavigation addBookPath={addBookPath} />

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
