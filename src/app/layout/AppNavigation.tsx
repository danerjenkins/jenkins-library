import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  BookOpenText,
  ChevronDown,
  Heart,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const primaryNavItems = [
  { to: "/view", label: "Library", Icon: BookOpen },
  { to: "/wishlist", label: "Wishlist", Icon: Heart },
  { to: "/admin", label: "Manage", Icon: Settings },
] as const;

const secondaryNavItems = [
  { to: "/search", label: "Search", Icon: Search },
  { to: "/series", label: "Series", Icon: BookOpenText },
  { to: "/genres", label: "Genres", Icon: Sparkles },
  { to: "/reading-list", label: "TBR", Icon: BookMarked },
  { to: "/stats", label: "Stats", Icon: BarChart3 },
] as const;

type NavIcon = ComponentType<{
  className?: string;
  size?: number;
  "aria-hidden"?: boolean;
}>;

interface AppNavigationProps {
  addBookPath: string;
}

export function AppNavigation() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const desktopMoreRef = useRef<HTMLDivElement | null>(null);
  const activeMore = secondaryNavItems.some(({ to }) => location.pathname === to);
  const getNavTarget = (to: string) =>
    to === location.pathname ? `${to}${location.search}` : to;

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!moreOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (desktopMoreRef.current?.contains(target)) {
        return;
      }

      setMoreOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [moreOpen]);

  const renderNavLink = (
    to: string,
    label: string,
    Icon: NavIcon,
    className: string,
    onClick?: () => void,
  ) => {
    const isActive = location.pathname === to;

    return (
      <Link
        key={to}
        to={getNavTarget(to)}
        className={className}
        aria-current={isActive ? "page" : undefined}
        data-active={isActive ? "true" : undefined}
        onClick={onClick}
      >
        <Icon className="app-nav__icon" aria-hidden={true} size={18} />
        <span className="app-nav__label">{label}</span>
      </Link>
    );
  };

  return (
    <div className="app-header__navs">
      <nav className="app-nav" aria-label="Primary navigation">
        {primaryNavItems.map(({ to, label, Icon }) =>
          renderNavLink(to, label, Icon, "app-nav__link"),
        )}
        <div className="app-more-nav" ref={desktopMoreRef}>
          <button
            type="button"
            className="app-nav__link app-nav__link--more"
            aria-expanded={moreOpen}
            aria-controls="desktop-more-navigation"
            data-active={moreOpen || activeMore ? "true" : undefined}
            onClick={() => setMoreOpen((current) => !current)}
          >
            <MoreHorizontal
              aria-hidden="true"
              size={18}
              className="app-nav__icon"
            />
            <span className="app-nav__label">More</span>
            <ChevronDown
              aria-hidden="true"
              size={16}
              className="app-more__caret"
            />
          </button>
          {moreOpen ? (
            <div
              id="desktop-more-navigation"
              className="app-more-nav__panel app-more-nav__panel--desktop"
            >
              <div className="app-more-nav__title">Extra pages</div>
              <nav className="app-more-nav__links" aria-label="Extra pages">
                {secondaryNavItems.map(({ to, label, Icon }) =>
                  renderNavLink(
                    to,
                    label,
                    Icon,
                    "app-more-nav__link",
                    () => setMoreOpen(false),
                  ),
                )}
              </nav>
            </div>
          ) : null}
        </div>
      </nav>
    </div>
  );
}

export function MobileAppNavigation({ addBookPath }: AppNavigationProps) {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const mobileMoreRef = useRef<HTMLDivElement | null>(null);
  const activeMore = secondaryNavItems.some(({ to }) => location.pathname === to);
  const getNavTarget = (to: string) =>
    to === location.pathname ? `${to}${location.search}` : to;

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!moreOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (mobileMoreRef.current?.contains(target)) {
        return;
      }

      setMoreOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [moreOpen]);

  const renderNavLink = (
    to: string,
    label: string,
    Icon: NavIcon,
    className: string,
    onClick?: () => void,
  ) => {
    const isActive = location.pathname === to;

    return (
      <Link
        key={to}
        to={getNavTarget(to)}
        className={className}
        aria-current={isActive ? "page" : undefined}
        data-active={isActive ? "true" : undefined}
        onClick={onClick}
      >
        <Icon className="app-nav__icon" aria-hidden={true} size={18} />
        <span className="app-nav__label">{label}</span>
      </Link>
    );
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {primaryNavItems.map(({ to, label, Icon }) =>
        renderNavLink(to, label, Icon, "mobile-bottom-nav__link"),
      )}
      <div className="mobile-bottom-nav__more-shell" ref={mobileMoreRef}>
        <button
          type="button"
          className="mobile-bottom-nav__link mobile-bottom-nav__link--more"
          aria-expanded={moreOpen}
          aria-controls="mobile-more-navigation"
          data-active={moreOpen || activeMore ? "true" : undefined}
          onClick={() => setMoreOpen((current) => !current)}
        >
          <MoreHorizontal
            aria-hidden="true"
            size={18}
            className="app-nav__icon"
          />
          <span className="app-nav__label">More</span>
          <ChevronDown
            aria-hidden="true"
            size={16}
            className="app-more__caret"
          />
        </button>
        {moreOpen ? (
          <div
            id="mobile-more-navigation"
            className="app-more-nav__panel app-more-nav__panel--mobile"
          >
            <div className="app-more-nav__title">Extra pages</div>
            <nav className="app-more-nav__links" aria-label="Extra pages">
              {secondaryNavItems.map(({ to, label, Icon }) =>
                renderNavLink(
                  to,
                  label,
                  Icon,
                  "app-more-nav__link",
                  () => setMoreOpen(false),
                ),
              )}
            </nav>
          </div>
        ) : null}
      </div>
      <Link to={addBookPath} className="mobile-bottom-nav__add">
        <Plus aria-hidden="true" size={22} />
        <span className="app-nav__label">Add</span>
      </Link>
    </nav>
  );
}
