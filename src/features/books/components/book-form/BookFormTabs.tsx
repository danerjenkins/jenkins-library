import type { BookFormSection } from "./BookForm.types";

const sectionButtonBase =
  "rounded px-3 py-1 text-xs font-medium transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300";

function SectionTabButton({
  activeSection,
  section,
  label,
  onClick,
}: {
  activeSection: BookFormSection;
  section: BookFormSection;
  label: string;
  onClick: (section: BookFormSection) => void;
}) {
  const isActive = activeSection === section;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`section-${section}`}
      onClick={() => onClick(section)}
      className={`${sectionButtonBase} ${
        isActive ? "bg-sage text-white" : "text-charcoal/70 hover:bg-warm-gray-light"
      }`}
    >
      {label}
    </button>
  );
}

export function BookFormTabs({
  activeSection,
  onSectionChange,
}: {
  activeSection: BookFormSection;
  onSectionChange: (section: BookFormSection) => void;
}) {
  return (
    <div
      className="hidden gap-1 self-start rounded-lg border border-warm-gray p-1 sm:flex"
      role="tablist"
      aria-label="Book form sections"
    >
      <SectionTabButton
        activeSection={activeSection}
        section="core"
        label="Core Info"
        onClick={onSectionChange}
      />
      <SectionTabButton
        activeSection={activeSection}
        section="reading"
        label="Reading Status"
        onClick={onSectionChange}
      />
      <SectionTabButton
        activeSection={activeSection}
        section="meta"
        label="Description & Metadata"
        onClick={onSectionChange}
      />
    </div>
  );
}

export function MobileSectionToggle({
  activeSection,
  section,
  label,
  onClick,
}: {
  activeSection: BookFormSection;
  section: BookFormSection;
  label: string;
  onClick: (section: BookFormSection) => void;
}) {
  const isActive = activeSection === section;

  return (
    <button
      type="button"
      onClick={() => onClick(section)}
      aria-controls={`section-${section}`}
      aria-expanded={isActive}
      className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-stone-700 transition-colors touch-manipulation hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-300 sm:hidden"
    >
      <span>{label}</span>
      <span className="text-xs text-stone-500">{isActive ? "Open" : "Closed"}</span>
    </button>
  );
}
