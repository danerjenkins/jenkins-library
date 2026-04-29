import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PanelLeft, SlidersHorizontal, X } from "lucide-react";
import { Button } from "../../../../ui/components/Button";

const drawerSurfaceClasses =
  "fixed inset-y-0 left-0 z-[90] flex h-dvh w-[min(72rem,calc(100vw-max(0.75rem,env(safe-area-inset-left))-max(0.75rem,env(safe-area-inset-right))))] max-w-none flex-col border-r border-warm-gray/80 bg-[linear-gradient(180deg,rgba(251,247,239,0.985),rgba(243,236,223,0.985))] shadow-[0_22px_44px_rgba(60,51,40,0.18)] backdrop-blur-xl transition-transform duration-300 ease-out motion-reduce:transition-none sm:rounded-r-[1.75rem]";
const floatingTriggerClasses =
  "fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] z-[80] inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-full border border-warm-gray/80 bg-cream/96 px-4 text-sm font-semibold text-stone-900 shadow-[0_16px_30px_rgba(60,51,40,0.18)] backdrop-blur-md transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out hover:-translate-y-px hover:border-sage-light hover:bg-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-0 min-[721px]:bottom-[max(1rem,env(safe-area-inset-bottom))] min-[721px]:right-[calc(max(1rem,env(safe-area-inset-right))+4.5rem)]";

interface FilterDrawerProps {
  title: string;
  description: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  triggerLabel?: string;
}

export function FilterDrawer({
  title,
  description,
  isOpen,
  onOpen,
  onClose,
  children,
  actions,
  footer,
  triggerLabel = "Open Filters",
}: FilterDrawerProps) {
  const [portalRoot] = useState<HTMLElement | null>(() =>
    typeof document !== "undefined" ? document.body : null,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const drawerUi = (
    <>
      <button
        type="button"
        onClick={onOpen}
        className={floatingTriggerClasses}
        aria-expanded={isOpen}
        aria-controls="filter-drawer-panel"
        aria-label={triggerLabel}
        title={triggerLabel}
      >
        <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
        <span className="hidden min-[721px]:inline">{triggerLabel}</span>
        <span className="sr-only">{triggerLabel}</span>
      </button>

      <div
        className={`fixed inset-0 z-85 bg-ink/36 backdrop-blur-[2px] transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={onClose}
      />

      <aside
        id="filter-drawer-panel"
        className={`${drawerSurfaceClasses} ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-drawer-title"
        aria-describedby="filter-drawer-description"
      >
        <div className="flex items-start justify-between gap-4 border-b border-warm-gray/70 px-5 py-5 sm:px-6">
          <div className="min-w-0 space-y-2">
            <div className="inline-flex min-h-8 items-center rounded-full border border-warm-gray/70 bg-cream/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              <PanelLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Browse Filters
            </div>
            <div className="space-y-1">
              <h2
                id="filter-drawer-title"
                className="font-display text-2xl font-semibold text-pretty text-stone-900"
              >
                {title}
              </h2>
              <p
                id="filter-drawer-description"
                className="max-w-sm text-sm leading-relaxed text-stone-600"
              >
                {description}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="min-h-11 min-w-11 shrink-0 px-0"
            aria-label="Close Filters"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <div className="space-y-5">
            {actions ? (
              <div className="flex flex-wrap items-center gap-2 border-b border-warm-gray/60 pb-4">
                {actions}
              </div>
            ) : null}
            <div className="space-y-4">{children}</div>
          </div>
        </div>

        {footer ? (
          <div className="border-t border-warm-gray/70 px-5 py-4 sm:px-6">{footer}</div>
        ) : null}
      </aside>
    </>
  );

  if (!portalRoot) {
    return null;
  }

  return createPortal(drawerUi, portalRoot);
}
