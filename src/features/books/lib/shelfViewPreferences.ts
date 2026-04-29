export type CardSize = "xsmall" | "small" | "medium" | "large";

export const CARD_SIZE_OPTIONS: Array<{ value: CardSize; label: string }> = [
  { value: "xsmall", label: "XS" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const STORAGE_VERSION = 1;

export const SHELF_CARD_SIZE_STORAGE_KEY =
  "jenkins-library:shelf-card-size";
export const LIBRARY_VIEW_STORAGE_KEY = "jenkins-library:view-library";
export const WISHLIST_VIEW_STORAGE_KEY = "jenkins-library:view-wishlist";

interface StorageEnvelope<T> {
  version: number;
  value: T;
}

export function isCardSize(value: string | null | undefined): value is CardSize {
  return (
    value === "xsmall" ||
    value === "small" ||
    value === "medium" ||
    value === "large"
  );
}

export function getDefaultCardSize(): CardSize {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 640px)").matches
  ) {
    return "small";
  }

  return "medium";
}

export function readStorageValue<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StorageEnvelope<T>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.version !== STORAGE_VERSION
    ) {
      return null;
    }

    return parsed.value;
  } catch (error) {
    console.warn(`Failed to read storage key "${key}"`, error);
    return null;
  }
}

export function writeStorageValue<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const payload: StorageEnvelope<T> = {
      version: STORAGE_VERSION,
      value,
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    console.warn(`Failed to write storage key "${key}"`, error);
  }
}
