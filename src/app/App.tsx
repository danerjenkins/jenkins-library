import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { routes } from "./routes";

const router = createBrowserRouter(
  routes.map((route) => ({
    ...route,
    element: <AppShell>{route.element}</AppShell>,
  })),
);

export function App() {
  return <RouterProvider router={router} />;
}
