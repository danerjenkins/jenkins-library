import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./app/App";

// === DIAGNOSTICS START ===
// Boot diagnostics
console.log("[PWA Diagnostics] Boot:", {
  location: window.location.href,
  swController: !!navigator.serviceWorker?.controller,
  baseUrl: import.meta.env.BASE_URL,
});

// Global error handlers
window.addEventListener("error", (event) => {
  console.error("[PWA Diagnostics] Error:", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("[PWA Diagnostics] Unhandled Rejection:", {
    reason: event.reason,
  });
});
// === DIAGNOSTICS END ===

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
