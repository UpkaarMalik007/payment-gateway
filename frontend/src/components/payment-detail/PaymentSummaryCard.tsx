interface Payment {
  amount: number;
  customer_name: string;
  customer_email: string;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-slate-200 text-slate-700",
  partially_refunded: "bg-orange-100 text-orange-700",
  expired: "bg-slate-100 text-slate-500",
};

function formatINR(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function PaymentSummaryCard({
  payment,
  totalRefunded,
  remaining,
}: {
  payment: Payment;
  totalRefunded: number;
  remaining: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mt-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-slate-500">
            {payment.customer_name} · {payment.customer_email}
          </p>
          <p className="font-display text-3xl font-semibold text-slate-900 mt-1">
            {formatINR(payment.amount)}
          </p>
        </div>
        <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${STATUS_STYLES[payment.status] || "bg-slate-100"}`}>
          {payment.status.replace("_", " ")}
        </span>
      </div>
      <p className="text-xs text-slate-400">
        Created {new Date(payment.created_at).toLocaleString()}
      </p>
      {totalRefunded > 0 && (
        <p className="text-sm text-slate-500 mt-2">
          {formatINR(totalRefunded)} refunded · {formatINR(remaining)} remaining
        </p>
      )}
    </div>
  );
}