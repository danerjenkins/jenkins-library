import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { ViewBooksPage } from "../features/books/ViewBooksPage";
import { AdminBooksPage } from "../features/books/AdminBooksPage";
import { StatsPage } from "../features/books/StatsPage";
import { BookDetailPage } from "../features/books/BookDetailPage";
import { WishlistPage } from "../features/books/WishlistPage";
import { SeriesPage } from "../features/books/SeriesPage";
import { GenresPage } from "../features/books/GenresPage";
import { SearchPage } from "../features/books/SearchPage";
import { ReadingListPage } from "../features/books/ReadingListPage";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

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
    path: "/admin",
    element: <AdminBooksPage />,
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
    element: <ReadingListPage />,
    errorElement: <RouteErrorBoundary />,
  },
];
