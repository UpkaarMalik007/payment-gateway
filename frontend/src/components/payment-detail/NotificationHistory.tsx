interface Notification {
  id: string;
  event_type: string;
  status: string;
  attempt_count: number;
  last_attempt_at: string | null;
}

const NOTIFICATION_STATUS_STYLES: Record<string, string> = {
  delivered: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
};

const EVENT_LABELS: Record<string, string> = {
  "payment.completed": "Payment completed",
  "payment.failed": "Payment failed",
  "payment.refunded": "Payment refunded",
  "payment.partially_refunded": "Payment partially refunded",
  "payment.expired": "Payment expired",
};

function eventIcon(eventType: string) {
  if (eventType.includes("completed")) return "✓";
  if (eventType.includes("failed")) return "✕";
  if (eventType.includes("refunded")) return "↩";
  if (eventType.includes("expired")) return "⏱";
  return "•";
}

export default function NotificationHistory({ notifications }: { notifications: Notification[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mt-4">
      <h2 className="font-semibold text-slate-900 mb-4">Notification history</h2>

      {notifications.length === 0 ? (
        <p className="text-sm text-slate-400">No notifications yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-100">
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                    NOTIFICATION_STATUS_STYLES[n.status] || "bg-slate-100 text-slate-500"
                  }`}
                >
                  {eventIcon(n.event_type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {EVENT_LABELS[n.event_type] || n.event_type}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {n.attempt_count} deliver{n.attempt_count === 1 ? "y" : "y"} attempt{n.attempt_count !== 1 ? "s" : ""}
                    {n.last_attempt_at && (
                      <> · last attempt {new Date(n.last_attempt_at).toLocaleString(undefined, {
                        month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                      })}</>
                    )}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                  NOTIFICATION_STATUS_STYLES[n.status] || "bg-slate-100 text-slate-600"
                }`}
              >
                {n.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}