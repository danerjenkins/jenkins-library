import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Eraser, Undo2 } from "lucide-react";
import { Button } from "../../../ui/components/Button";
import { drawStroke, loadImage, type Stroke } from "../lib/screenshotMarkup";

// Ink has to stand out on any page, so these are deliberately off-palette.
const COLORS = [
  { value: "#dc2626", label: "Red" },
  { value: "#facc15", label: "Yellow" },
  { value: "#2563eb", label: "Blue" },
];

interface ScreenshotAnnotatorProps {
  base: string;
  initialStrokes: Stroke[];
  onDone: (strokes: Stroke[]) => void;
  onCancel: () => void;
}

export function ScreenshotAnnotator({
  base,
  initialStrokes,
  onDone,
  onCancel,
}: ScreenshotAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [strokes, setStrokes] = useState(initialStrokes);
  const [color, setColor] = useState(COLORS[0].value);

  useEffect(() => {
    let ignore = false;
    loadImage(base)
      .then((loaded) => {
        if (!ignore) setImage(loaded);
      })
      .catch(() => {
        if (!ignore) onCancel();
      });
    return () => {
      ignore = true;
    };
  }, [base, onCancel]);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context || !image) return;
    context.drawImage(image, 0, 0);
    for (const stroke of strokes) drawStroke(context, stroke);
  }, [image, strokes]);

  function toImagePoint(event: PointerEvent<HTMLCanvasElement>): [number, number] {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return [
      ((event.clientX - rect.left) / rect.width) * canvas.width,
      ((event.clientY - rect.top) / rect.height) * canvas.height,
    ];
  }

  function drawActive(event: PointerEvent<HTMLCanvasElement>) {
    const context = event.currentTarget.getContext("2d");
    if (context && activeStrokeRef.current) drawStroke(context, activeStrokeRef.current);
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!image || event.button !== 0 || activeStrokeRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    activeStrokeRef.current = {
      color,
      width: Math.max(4, Math.round(image.naturalWidth / 220)),
      points: [toImagePoint(event)],
    };
    drawActive(event);
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!activeStrokeRef.current) return;
    activeStrokeRef.current.points.push(toImagePoint(event));
    drawActive(event);
  }

  function finishStroke() {
    const stroke = activeStrokeRef.current;
    activeStrokeRef.current = null;
    if (stroke) setStrokes((current) => [...current, stroke]);
  }

  return (
    <div
      className="feedback-annotator"
      role="dialog"
      aria-modal="true"
      aria-label="Draw on the screenshot"
    >
      <div className="flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 rounded-lg bg-cream p-2 shadow-soft-lg">
        <div role="radiogroup" aria-label="Pen color" className="flex items-center gap-1">
          {COLORS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={color === value}
              aria-label={label}
              className="feedback-annotator__color"
              style={{ backgroundColor: value }}
              onClick={() => setColor(value)}
            />
          ))}
          <button
            type="button"
            className="feedback-widget__icon-button disabled:opacity-40"
            aria-label="Undo"
            title="Undo"
            disabled={strokes.length === 0}
            onClick={() => setStrokes((current) => current.slice(0, -1))}
          >
            <Undo2 aria-hidden="true" size={18} />
          </button>
          <button
            type="button"
            className="feedback-widget__icon-button disabled:opacity-40"
            aria-label="Clear drawing"
            title="Clear drawing"
            disabled={strokes.length === 0}
            onClick={() => setStrokes([])}
          >
            <Eraser aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onDone(strokes)}>
            Done
          </Button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={image?.naturalWidth ?? 0}
        height={image?.naturalHeight ?? 0}
        className="feedback-annotator__canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
      />
    </div>
  );
}
