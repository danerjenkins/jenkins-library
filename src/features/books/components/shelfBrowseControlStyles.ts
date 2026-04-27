export const actionLinkClasses =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-sage bg-sage px-4 py-2 text-sm font-semibold text-white no-underline shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out hover:border-sage-dark hover:bg-sage-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px";

export const filterFieldGridClasses = "grid gap-3";

const densityGroupClasses =
  "grid grid-cols-4 rounded-lg border border-warm-gray bg-cream p-0.5 shadow-inner shadow-white/50";
const densityButtonClasses =
  "min-h-11 rounded-md px-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-[background-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px";
const segmentedControlClasses =
  "grid grid-cols-1 gap-1 rounded-lg border border-warm-gray bg-cream p-1 shadow-inner shadow-white/50 sm:grid-cols-3";
const segmentedButtonClasses =
  "min-h-11 rounded-md px-4 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-px";
const discoveryLinkClasses =
  "group flex min-h-32 flex-col justify-between rounded-2xl border border-warm-gray/80 bg-cream/95 p-4 text-left no-underline shadow-soft transition-[border-color,box-shadow,transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-sage/55 hover:bg-parchment/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:translate-y-0 sm:min-h-36 sm:p-5";

export const ownershipSegmentOptions = [
  { value: "owned", label: "Library Only" },
  { value: "wishlist", label: "Wishlist Only" },
  { value: "all", label: "Library + Wishlist" },
] as const;

export function getDensityGroupClasses() {
  return densityGroupClasses;
}

export function getDensityButtonClasses(selected: boolean) {
  return `${densityButtonClasses} ${
    selected
      ? "bg-sage text-white shadow-sm"
      : "text-charcoal/70 hover:bg-warm-gray-light hover:text-charcoal"
  }`;
}

export function getSegmentedControlClasses() {
  return segmentedControlClasses;
}

export function getSegmentedButtonClasses(selected: boolean) {
  return `${segmentedButtonClasses} ${
    selected
      ? "border border-sage bg-sage text-white shadow-sm"
      : "border border-transparent bg-transparent text-charcoal/75 hover:bg-warm-gray-light hover:text-charcoal"
  }`;
}

export function getDiscoveryLinkClasses() {
  return discoveryLinkClasses;
}
