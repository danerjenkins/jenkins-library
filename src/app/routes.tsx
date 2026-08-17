import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { ViewBooksPage } from "../features/books/pages/ViewBooksPage";
import { AdminBooksPage } from "../features/books/pages/AdminBooksPage";
import { StatsPage } from "../features/books/pages/StatsPage";
import { BookDetailPage } from "../features/books/pages/BookDetailPage";
import { BookEditorPage } from "../features/books/pages/BookEditorPage";
import { WishlistPage } from "../features/books/pages/WishlistPage";
import { SeriesPage } from "../features/books/pages/SeriesPage";
import { GenresPage } from "../features/books/pages/GenresPage";
import { SearchPage } from "../features/books/pages/SearchPage";
import { ReadingListPage } from "../features/books/pages/ReadingListPage";
import { QuickReadPage } from "../features/books/pages/QuickReadPage";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { ProtectedEditorRoute } from "./auth/ProtectedEditorRoute";
import { LoginPage } from "../features/auth/LoginPage";
import { ProfilePage } from "../features/profile/ProfilePage";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Navigate to="/view" replace />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/view",
    element: <ViewBooksPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/wishlist",
    element: <WishlistPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/book/:id",
    element: <BookDetailPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/profile",
    element: <ProfilePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/book/:id/edit",
    element: (
      <ProtectedEditorRoute>
        <BookEditorPage />
      </ProtectedEditorRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/book/new",
    element: (
      <ProtectedEditorRoute>
        <BookEditorPage />
      </ProtectedEditorRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedEditorRoute>
        <AdminBooksPage />
      </ProtectedEditorRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/stats",
    element: <StatsPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/series",
    element: <SeriesPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/genres",
    element: <GenresPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/search",
    element: <SearchPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/reading-list",
    element: (
      <ProtectedEditorRoute>
        <ReadingListPage />
      </ProtectedEditorRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/quick-read",
    element: <QuickReadPage />,
    errorElement: <RouteErrorBoundary />,
  },
];
