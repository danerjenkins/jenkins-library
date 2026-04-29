import { Search } from "lucide-react";
import { Button } from "../../../ui/components/Button";
import { Input } from "../../../ui/components/Input";
import { Select } from "../../../ui/components/Select";
import type { BookFormat } from "../bookTypes";
import { BOOK_FORMAT_LABELS } from "../bookTypes";

const filterPanelClasses =
  "sticky top-2 z-20 space-y-3 rounded-2xl border border-warm-gray/85 bg-parchment/95 p-3 shadow-sm ring-1 ring-white/40 backdrop-blur-sm sm:top-3 sm:p-4 lg:static";
const filterPanelHeaderClasses =
  "flex flex-col gap-3 rounded-xl border border-warm-gray/70 bg-cream/90 p-3 sm:flex-row sm:items-start sm:justify-between";
const filterFieldGridClasses = "ds-filter-grid sm:grid-cols-2 lg:grid-cols-5";
const filterMetaRowClasses =
  "flex flex-col items-start justify-between gap-2 rounded-lg border border-transparent px-1 py-0.5 sm:flex-row sm:items-center";
const segmentedControlClasses = "ds-segmented-control ds-segmented-control--two";
const segmentedButtonClasses = "min-h-10 px-3 text-xs";

export function ManageBooksFilterPanel({
  searchQuery,
  filterGenre,
  filterReadStatus,
  filterOwnership,
  filterFormat,
  filterSeries,
  availableGenres,
  availableFormats,
  availableSeries,
  filteredCount,
  hasActiveFilters,
  onSearchQueryChange,
  onFilterGenreChange,
  onFilterReadStatusChange,
  onFilterOwnershipChange,
  onFilterFormatChange,
  onFilterSeriesChange,
  onClearFilters,
}: {
  searchQuery: string;
  filterGenre: string;
  filterReadStatus: "ALL" | "NEITHER" | "DANE" | "EMMA" | "BOTH";
  filterOwnership: "owned" | "wishlist";
  filterFormat: string;
  filterSeries: string;
  availableGenres: string[];
  availableFormats: BookFormat[];
  availableSeries: string[];
  filteredCount: number;
  hasActiveFilters: boolean;
  onSearchQueryChange: (value: string) => void;
  onFilterGenreChange: (value: string) => void;
  onFilterReadStatusChange: (value: "ALL" | "NEITHER" | "DANE" | "EMMA" | "BOTH") => void;
  onFilterOwnershipChange: (value: "owned" | "wishlist") => void;
  onFilterFormatChange: (value: string) => void;
  onFilterSeriesChange: (value: string) => void;
  onClearFilters: () => void;
}) {
  return (
    <div
      className={filterPanelClasses}
      role="region"
      aria-labelledby="manage-filters-heading"
      aria-describedby="manage-filters-summary"
    >
      <div className={filterPanelHeaderClasses}>
        <div className="space-y-1">
          <div
            id="manage-filters-heading"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500"
          >
            Manage Filters
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-600">
            Switch between owned and wishlist inventory, then narrow the list before editing.
          </p>
        </div>
        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Shelf
          </div>
          <div className={segmentedControlClasses} role="tablist" aria-label="Manage ownership">
            {(["owned", "wishlist"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filterOwnership === value}
                onClick={() => onFilterOwnershipChange(value)}
                className={`ds-segmented-button ${segmentedButtonClasses} ${
                  filterOwnership === value
                    ? "border border-sage bg-sage text-white shadow-sm"
                    : "border border-transparent bg-transparent text-charcoal/70 hover:bg-warm-gray-light hover:text-charcoal"
                }`}
              >
                {value === "owned" ? "Owned" : "Wishlist"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={filterFieldGridClasses}>
        <div className="relative">
          <Input
            id="admin-search"
            name="adminSearch"
            label="Search"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Title or author..."
            autoComplete="off"
            className="pl-11! pr-10"
          />
          <Search
            className="pointer-events-none absolute left-3 top-8 h-4 w-4 text-stone-400"
            aria-hidden="true"
          />
        </div>

        <Select
          id="admin-filter-genre"
          label="Genre"
          value={filterGenre}
          onChange={(event) => onFilterGenreChange(event.target.value)}
          options={[
            { value: "ALL", label: "All Genres" },
            ...availableGenres.map((genre) => ({ value: genre, label: genre })),
          ]}
        />

        <Select
          id="admin-filter-read"
          label="Read Status"
          value={filterReadStatus}
          onChange={(event) =>
            onFilterReadStatusChange(event.target.value as "ALL" | "NEITHER" | "DANE" | "EMMA" | "BOTH")
          }
          options={[
            { value: "ALL", label: "All" },
            { value: "NEITHER", label: "To read" },
            { value: "DANE", label: "Read by Dane" },
            { value: "EMMA", label: "Read by Emma" },
            { value: "BOTH", label: "Read by both" },
          ]}
        />

        <Select
          id="admin-filter-format"
          label="Format"
          value={filterFormat}
          onChange={(event) => onFilterFormatChange(event.target.value)}
          options={[
            { value: "ALL", label: "All Formats" },
            ...availableFormats.map((format) => ({
              value: format,
              label: BOOK_FORMAT_LABELS[format],
            })),
          ]}
        />

        <Select
          id="admin-filter-series"
          label="Series"
          value={filterSeries}
          onChange={(event) => onFilterSeriesChange(event.target.value)}
          options={[
            { value: "ALL", label: "All Series" },
            { value: "NONE", label: "No Series" },
            ...availableSeries.map((series) => ({ value: series, label: series })),
          ]}
        />
      </div>

      <div className={filterMetaRowClasses}>
        <div id="manage-filters-summary" className="text-xs text-stone-600" aria-live="polite">
          {filteredCount} {filteredCount === 1 ? "book" : "books"}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="text-xs text-stone-500">
            Keep the queue compact so edit actions stay quick and predictable.
          </div>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="secondary"
              onClick={onClearFilters}
              className="min-h-10 px-3 text-xs"
            >
              Clear Filters
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
