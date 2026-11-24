import { useEffect, useState } from "react";
import { useAuth } from "../../../app/auth/useAuth";
import { getIsFeedbackAdmin } from "../../../repos/feedbackRepo";

/** null while still checking. The database enforces access; this only shapes the UI. */
export function useIsFeedbackAdmin(): boolean | null {
  const { isLoading, session } = useAuth();
  const userId = session?.user.id ?? null;
  const [result, setResult] = useState<{ userId: string; isAdmin: boolean } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let ignore = false;
    getIsFeedbackAdmin()
      .catch(() => false)
      .then((isAdmin) => {
        if (!ignore) setResult({ userId, isAdmin });
      });
    return () => {
      ignore = true;
    };
  }, [userId]);

  if (!userId) return isLoading ? null : false;
  return result?.userId === userId ? result.isAdmin : null;
}
