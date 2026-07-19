interface Refund {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
}

function formatINR(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function RefundHistory({ refunds }: { refunds: Refund[] }) {
  if (refunds.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mt-4">
      <h2 className="font-semibold text-slate-900 mb-4">Refund history</h2>
      <div className="divide-y divide-slate-100">
        {refunds.map((r) => (
          <div key={r.id} className="py-3 flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-900">{r.reason || "No reason given"}</p>
              <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</p>
            </div>
            <span className="font-semibold text-slate-900">{formatINR(r.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}