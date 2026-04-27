import { useRouteError } from "react-router-dom";

export function RouteErrorBoundary() {
  const error = useRouteError();
  console.error("[PWA Diagnostics] Route Error:", error);

  return (
    <div className="ds-page-layout">
      <section className="ds-page-section space-y-3">
        <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900">
          Something went wrong
        </h1>
        <p className="text-sm leading-relaxed text-stone-600">
          Check the console for details.
        </p>
        <pre className="overflow-auto rounded-xl border border-warm-gray bg-cream p-4 text-sm text-stone-700">
          {JSON.stringify(error, null, 2)}
        </pre>
      </section>
    </div>
  );
}
