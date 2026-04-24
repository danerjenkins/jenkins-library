import type { RefObject } from "react";
import type { BookFormSection } from "./BookForm.types";
import { MobileSectionToggle } from "./BookFormTabs";

function ReadingToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm font-medium text-stone-700 transition-colors hover:bg-white"
    >
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-warm-gray text-stone-900 focus:ring-2 focus:ring-sage/20"
      />
      <span>{label}</span>
    </label>
  );
}

export function BookFormReadingSection({
  activeSection,
  onSectionChange,
  sectionRef,
  finished,
  readByDane,
  readByEmma,
  onFinishedChange,
  onReadByDaneChange,
  onReadByEmmaChange,
}: {
  activeSection: BookFormSection;
  onSectionChange: (section: BookFormSection) => void;
  sectionRef: RefObject<HTMLElement | null>;
  finished: boolean;
  readByDane: boolean;
  readByEmma: boolean;
  onFinishedChange: (checked: boolean) => void;
  onReadByDaneChange: (checked: boolean) => void;
  onReadByEmmaChange: (checked: boolean) => void;
}) {
  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      className="rounded-lg border border-warm-gray bg-parchment/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/20"
    >
      <MobileSectionToggle
        activeSection={activeSection}
        section="reading"
        label="Reading Status"
        onClick={onSectionChange}
      />
      <div
        id="section-reading"
        role="tabpanel"
        className={`${activeSection === "reading" ? "block" : "hidden"} px-4 pb-4 pt-4`}
      >
        <div className="space-y-4">
          <h3 className="hidden text-sm font-semibold text-stone-700 sm:block">Reading Status</h3>
          <div className="space-y-2 rounded-lg border border-warm-gray bg-cream/70 p-3">
            <h4 className="text-sm font-semibold text-stone-700">Read Status</h4>
            <ReadingToggle
              id="finished"
              label="Finished"
              checked={finished}
              onChange={onFinishedChange}
            />
            <ReadingToggle
              id="readByDane"
              label="Read by Dane"
              checked={readByDane}
              onChange={onReadByDaneChange}
            />
            <ReadingToggle
              id="readByEmma"
              label="Read by Emma"
              checked={readByEmma}
              onChange={onReadByEmmaChange}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
