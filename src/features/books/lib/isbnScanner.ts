export function normalizeIsbnInput(value: string) {
  return value.replace(/[^\dXx]/g, "");
}

export function canUseMobileIsbnScanner() {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    !window.isSecureContext ||
    !("BarcodeDetector" in window) ||
    !("mediaDevices" in navigator) ||
    !navigator.mediaDevices.getUserMedia
  ) {
    return false;
  }

  const hasTouch = navigator.maxTouchPoints > 0;
  const hasCoarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  return hasTouch || hasCoarsePointer;
}
