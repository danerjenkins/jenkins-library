import { formatDateTime } from "../lib/feedbackLabels";
import type { BugMessage } from "../lib/feedbackTypes";

interface FeedbackThreadProps {
  messages: BugMessage[];
  viewer: BugMessage["sender_role"];
}

export function FeedbackThread({ messages, viewer }: FeedbackThreadProps) {
  if (messages.length === 0) return null;

  return (
    <ul className="space-y-2">
      {messages.map(({ id, sender_role, body, created_at }) => {
        const isOwn = sender_role === viewer;
        const name = isOwn ? "You" : sender_role === "team" ? "Jenkins Library" : "Reporter";
        return (
          <li
            key={id}
            className={`rounded-lg border border-warm-gray px-3 py-2 text-sm ${
              isOwn ? "ml-8 bg-parchment/70" : "mr-8 bg-sage/10"
            }`}
          >
            <div className="text-xs text-stone-600">
              {name}, {formatDateTime(created_at)}
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-stone-900">{body}</p>
          </li>
        );
      })}
    </ul>
  );
}
