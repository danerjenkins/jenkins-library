import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { routes } from "./routes";

// Router basename must match Vite base and PWA manifest scope for installed PWA to work
const router = createBrowserRouter(
  routes.map((route) => ({
    ...route,
    element: <AppShell>{route.element}</AppShell>,
  })),
  {
    basename: import.meta.env.BASE_URL,
  },
);

export function App() {
  return <RouterProvider router={router} />;
}
