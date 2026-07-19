import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FaCheck, FaTimes } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL;

interface PublicPayment {
  id: string;
  amount: number;
  currency: string;
  customerName: string;
  status: string;
}

function formatINR(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function PayPage() {
  const { id } = useParams();
  const [payment, setPayment] = useState<PublicPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPayment();
  }, [id]);

  async function loadPayment() {
    setLoading(true);
    const res = await axios.get(`${API_URL}/pay/${id}`);
    setPayment(res.data);
    setLoading(false);
  }

  async function handleAction(outcome: "success" | "failure") {
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_URL}/pay/${id}/complete`, { outcome });
      setPayment(res.data);
    } catch (err: any) {
      await loadPayment();
    } finally {
      setActionLoading(false);
    }
  }

  if (loading || !payment) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-sm w-full text-center">
        <p className="text-sm text-slate-500 mb-1">Payment request</p>
        <p className="font-display text-4xl font-semibold text-slate-900 mb-2">
          {formatINR(payment.amount)}
        </p>
        <p className="text-sm text-slate-500 mb-8">
          Hi {payment.customerName}, complete your payment
        </p>

        {payment.status === "pending" ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleAction("success")}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-3 font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
              {actionLoading ? ("Processing...") : (<><FaCheck />Complete Payment</>
              )}
            </button>
            <button
  onClick={() => handleAction("failure")}
  disabled={actionLoading}
  className="border border-red-200 text-red-600 hover:bg-red-50 rounded-lg py-3 font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
>
  <FaTimes />
  Cancel Payment
</button>
          </div>
        ) : (
          <div
            className={`rounded-lg py-4 font-semibold ${
              payment.status === "completed"
                ? "bg-emerald-100 text-emerald-700"
                : payment.status === "expired"
                ? "bg-slate-100 text-slate-500"
                : "bg-red-100 text-red-700"
            }`}
          >
            Payment {payment.status}
          </div>
        )}
      </div>
    </div>
  );
}