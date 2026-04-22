import { useRouteError } from "react-router-dom";

export function RouteErrorBoundary() {
  const error = useRouteError();
  console.error("[PWA Diagnostics] Route Error:", error);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Something went wrong</h1>
      <p>Check the console for details.</p>
      <pre style={{ background: "#f5f5f5", padding: "1rem", overflow: "auto" }}>
        {JSON.stringify(error, null, 2)}
      </pre>
    </div>
  );
}
