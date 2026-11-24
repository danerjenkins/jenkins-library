const OPEN_EVENT = "open-feedback";
const SEEN_EVENT = "feedback-seen";

function subscribe(name: string, listener: () => void) {
  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}

export const openFeedback = () => window.dispatchEvent(new Event(OPEN_EVENT));
export const onOpenFeedback = (listener: () => void) => subscribe(OPEN_EVENT, listener);

/** The reporter has read their updates, so unread badges should clear. */
export const announceFeedbackSeen = () => window.dispatchEvent(new Event(SEEN_EVENT));
export const onFeedbackSeen = (listener: () => void) => subscribe(SEEN_EVENT, listener);
