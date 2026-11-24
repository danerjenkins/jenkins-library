import { useEffect, useState } from "react";
import { useAuth } from "../../../app/auth/useAuth";
import { getUnreadFeedbackCount } from "../../../repos/feedbackRepo";
import { onFeedbackSeen } from "../lib/feedbackEvents";

/** How many of the signed-in reporter's reports have news they have not read. */
export function useUnreadFeedback(): number {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [unread, setUnread] = useState({ userId: null as string | null, count: 0 });

  useEffect(() => {
    if (!userId) return;
    let ignore = false;

    const load = async () => {
      try {
        const count = await getUnreadFeedbackCount();
        if (!ignore) setUnread({ userId, count });
      } catch {
        // The badge is a convenience; the feedback page still shows everything.
      }
    };

    void load();
    const refresh = () => void load();
    const unsubscribe = onFeedbackSeen(refresh);
    window.addEventListener("focus", refresh);
    return () => {
      ignore = true;
      unsubscribe();
      window.removeEventListener("focus", refresh);
    };
  }, [userId]);

  return unread.userId === userId ? unread.count : 0;
}
