import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { BookListPage } from "../features/books/BookListPage";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Navigate to="/books" replace />,
  },
  {
    path: "/books",
    element: <BookListPage />,
  },
];
