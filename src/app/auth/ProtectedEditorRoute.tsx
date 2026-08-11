import { Navigate, useLocation } from "react-router-dom";
import { LoadingState } from "../../ui/components/LoadingState";
import { useAuth } from "./useAuth";

export function ProtectedEditorRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { canEdit, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center px-4">
        <LoadingState
          title="Checking Editor Access"
          description="Confirming whether this session can change the library."
          variant="detail"
          className="w-full"
        />
      </div>
    );
  }

  if (!canEdit) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace to={`/login?returnTo=${encodeURIComponent(returnTo)}`} />;
  }

  return children;
}
