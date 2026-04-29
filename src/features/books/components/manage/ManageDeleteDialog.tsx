import { useEffect, useId, useRef } from "react";

interface ManageDeleteDialogProps {
  open: boolean;
  title: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ManageDeleteDialog({
  open,
  title,
  busy = false,
  onCancel,
  onConfirm,
}: ManageDeleteDialogProps) {
  const headingId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        event.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, onCancel, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/45 p-4 sm:items-center"
      role="presentation"
      onClick={busy ? undefined : onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        className="ds-panel-surface w-full max-w-md border-rose-200 bg-cream p-5 shadow-soft overscroll-contain"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-2">
          <h3
            id={headingId}
            className="font-display text-xl font-bold tracking-tight text-stone-900"
          >
            Delete Book
          </h3>
          <p id={descriptionId} className="text-sm leading-relaxed text-stone-600">
            Delete <span className="font-semibold text-stone-900">{title}</span>?
          </p>
          <p className="text-sm font-medium text-rose-700">This cannot be undone.</p>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="ds-button ds-button--secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="ds-button ds-button--danger"
          >
            {busy ? "Deleting…" : "Delete Book"}
          </button>
        </div>
      </div>
    </div>
  );
}
