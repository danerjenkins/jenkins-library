export interface Stroke {
  color: string;
  width: number;
  points: [number, number][];
}

export function drawStroke(context: CanvasRenderingContext2D, stroke: Stroke) {
  const [first, ...rest] = stroke.points;
  if (!first) return;
  context.strokeStyle = stroke.color;
  context.lineWidth = stroke.width;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(first[0], first[1]);
  // A zero-length line with round caps draws the dot for a single tap.
  context.lineTo(first[0], first[1]);
  for (const [x, y] of rest) context.lineTo(x, y);
  context.stroke();
}

export function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the screenshot."));
    image.src = source;
  });
}

/** Flatten the screenshot and its strokes into one PNG data URL. */
export async function renderMarkup(base: string, strokes: Stroke[]): Promise<string> {
  if (strokes.length === 0) return base;
  const image = await loadImage(base);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) return base;
  context.drawImage(image, 0, 0);
  for (const stroke of strokes) drawStroke(context, stroke);
  return canvas.toDataURL("image/png");
}
