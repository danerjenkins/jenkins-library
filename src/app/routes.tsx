import { Navigate, useRouteError } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { ViewBooksPage } from "../features/books/ViewBooksPage";
import { AdminBooksPage } from "../features/books/AdminBooksPage";
import { StatsPage } from "../features/books/StatsPage";
import { BookDetailPage } from "../features/books/BookDetailPage";
import { WishlistPage } from "../features/books/WishlistPage";

// === DIAGNOSTICS START ===
function ErrorBoundary() {
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
// === DIAGNOSTICS END ===

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Navigate to="/view" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/view",
    element: <ViewBooksPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/wishlist",
    element: <WishlistPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/book/:id",
    element: <BookDetailPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/admin",
    element: <AdminBooksPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/stats",
    element: <StatsPage />,
    errorElement: <ErrorBoundary />,
  },
];
