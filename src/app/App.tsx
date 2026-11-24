import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { FeedbackWidget } from "../features/feedback/components/FeedbackWidget";
import { recordNavigation } from "../features/feedback/lib/captureRings";
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

const recordLocation = ({ pathname, search }: { pathname: string; search: string }) =>
  recordNavigation(`${pathname}${search}`);

recordLocation(router.state.location);
router.subscribe(({ location }) => recordLocation(location));

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <FeedbackWidget onViewMyFeedback={() => void router.navigate("/feedback")} />
    </AuthProvider>
  );
}
