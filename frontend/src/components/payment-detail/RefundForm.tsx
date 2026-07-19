import { useState } from "react";
import { apiClient } from "../../api/client";

export default function RefundForm({
  paymentId,
  remaining,
  onRefundSuccess,
}: {
  paymentId: string;
  remaining: number;
  onRefundSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError("Enter a valid refund amount");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/payments/${paymentId}/refunds`, {
        amount: amountNum,
        reason: reason || undefined,
      });
      setAmount("");
      setReason("");
      await onRefundSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mt-4">
      <h2 className="font-semibold text-slate-900 mb-4">Issue a refund</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-3">
          <input
            type="number"
            step="0.01"
            placeholder={`Up to ₹${(remaining / 100).toFixed(2)}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 rounded-lg bg-slate-100 border border-transparent focus:border-teal-500 focus:bg-white px-4 py-3 text-sm outline-none transition"
          />
          <button
            type="button"
            onClick={() => setAmount((remaining / 100).toString())}
            className="text-xs text-slate-500 hover:text-slate-700 whitespace-nowrap"
          >
            Full amount
          </button>
        </div>
        <input
          type="text"
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="rounded-lg bg-slate-100 border border-transparent focus:border-teal-500 focus:bg-white px-4 py-3 text-sm outline-none transition"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg py-3 font-semibold transition disabled:opacity-50"
        >
          {loading ? "Processing..." : "Issue refund"}
        </button>
      </form>
    </div>
  );
}