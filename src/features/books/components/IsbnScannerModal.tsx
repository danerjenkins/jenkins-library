import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "../../../ui/components/Button";

type BarcodeDetectorLike = {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

export function IsbnScannerModal({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (value: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    const stopStream = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    const detectWithCamera = async () => {
      setErrorMessage(null);
      setIsStarting(true);

      const detectorCtor = (
        window as Window & {
          BarcodeDetector?: BarcodeDetectorConstructor;
        }
      ).BarcodeDetector;

      if (!detectorCtor) {
        setErrorMessage("Barcode scanning is not supported in this browser.");
        setIsStarting(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          throw new Error("Scanner video element is unavailable.");
        }

        video.srcObject = stream;
        await video.play();

        const detector = new detectorCtor({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
        });

        const scan = async () => {
          if (!active || !videoRef.current) {
            return;
          }

          try {
            const codes = await detector.detect(videoRef.current);
            const detected = codes.find((code) => Boolean(code.rawValue?.trim()));
            if (detected?.rawValue) {
              onDetected(detected.rawValue.trim());
              onClose();
              return;
            }
          } catch (error) {
            console.warn("Barcode scan attempt failed:", error);
          }

          frameRef.current = window.requestAnimationFrame(scan);
        };

        frameRef.current = window.requestAnimationFrame(scan);
      } catch (error) {
        console.error("Failed to open barcode scanner:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "Could not open the camera scanner.",
        );
      } finally {
        setIsStarting(false);
      }
    };

    void detectWithCamera();

    return () => {
      active = false;
      stopStream();
    };
  }, [onClose, onDetected, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
      <div className="ds-panel-surface w-full max-w-xl rounded-3xl bg-cream p-4 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-stone-900">Scan ISBN</h2>
            <p className="ds-subtle-text mt-1 text-sm leading-relaxed">
              Point the camera at a barcode or ISBN label. If scanning is unsupported, type the
              number manually instead.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ds-button ds-button--secondary h-10 w-10 rounded-full px-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-warm-gray bg-stone-950">
          <video ref={videoRef} className="aspect-4/3 w-full object-cover" muted autoPlay playsInline />
        </div>

        <div className="mt-4 space-y-3">
          {errorMessage ? (
            <div className="ds-panel-surface border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="ds-muted-meta text-xs">
              {isStarting ? "Starting camera..." : "Hold steady until the ISBN is recognized."}
            </div>
            <Button type="button" variant="secondary" onClick={onClose}>
              Close Scanner
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
