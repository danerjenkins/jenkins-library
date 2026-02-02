import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { ViewBooksPage } from "../features/books/ViewBooksPage";
import { AdminBooksPage } from "../features/books/AdminBooksPage";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Navigate to="/view" replace />,
  },
  {
    path: "/view",
    element: <ViewBooksPage />,
  },
  {
    path: "/admin",
    element: <AdminBooksPage />,
  },
];
