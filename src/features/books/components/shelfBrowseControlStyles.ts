export const actionLinkClasses = "ds-action-link";

export const filterFieldGridClasses = "ds-filter-grid";

const densityGroupClasses = "ds-density-group";
const densityButtonClasses = "ds-density-button";
const segmentedControlClasses = "ds-segmented-control";
const segmentedButtonClasses = "ds-segmented-button";
const discoveryLinkClasses = "group ds-discovery-link";

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
