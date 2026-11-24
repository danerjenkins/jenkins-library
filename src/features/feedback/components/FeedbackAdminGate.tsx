import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LoadingState } from "../../../ui/components/LoadingState";
import { PageLayout, PageSection } from "../../../ui/components/PageLayout";
import { useIsFeedbackAdmin } from "../hooks/useIsFeedbackAdmin";

export function FeedbackAdminGate({ children }: { children: ReactNode }) {
  const isAdmin = useIsFeedbackAdmin();
  const { pathname } = useLocation();

  if (isAdmin) return children;

  return (
    <PageLayout>
      {isAdmin === null ? (
        <LoadingState title="Checking Access" variant="panel" />
      ) : (
        <PageSection>
          <p>
            The feedback inbox is for the library's owner.{" "}
            <Link to={`/login?returnTo=${encodeURIComponent(pathname)}`}>Sign in</Link> if that's you.
          </p>
        </PageSection>
      )}
    </PageLayout>
  );
}
