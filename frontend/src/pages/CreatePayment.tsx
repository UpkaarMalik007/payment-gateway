import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";

interface PaymentResult {
  payment: { id: string; amount: number; status: string };
  payLink: string;
  qrCode: string;
  expiresAt: string;
}

function formatCountdown(expiresAt: string) {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function CreatePayment() {
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!result) return;
    const interval = setInterval(() => {
      setCountdown(formatCountdown(result.expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [result]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!customerName || customerName.length < 2) {
      setError("Enter a customer name");
      return;
    }
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      setError("Enter a valid customer email");
      return;
    }

    setLoading(true);
    try {
      const idempotencyKey = crypto.randomUUID(); 

      const res = await apiClient.post(
        "/payments",
        { amount: amountNum, customerName, customerEmail },
        { headers: { "Idempotency-Key": idempotencyKey } }
      );

      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!result) return;
    navigator.clipboard
      .writeText(result.payLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); 
      })
      .catch((err) => {
        console.error("Copy failed:", err);
      });
  }

  const isExpired = result && countdown === "Expired";

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-md mx-auto">
        <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to dashboard
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 p-6 mt-4">
          {!result ? (
            <>
              <h1 className="font-display text-xl font-semibold text-slate-900 mb-6">
                Create payment request
              </h1>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-800 mb-1 block">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="00.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg bg-slate-100 border border-transparent focus:border-teal-500 focus:bg-white px-4 py-3 text-sm outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-800 mb-1 block">Customer name</label>
                  <input
                    type="text"
                    placeholder="John Anderson"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-lg bg-slate-100 border border-transparent focus:border-teal-500 focus:bg-white px-4 py-3 text-sm outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-800 mb-1 block">Customer email</label>
                  <input
                    type="email"
                    placeholder="john.anderson@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-lg bg-slate-100 border border-transparent focus:border-teal-500 focus:bg-white px-4 py-3 text-sm outline-none transition"
                  />
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-lg py-3 font-semibold transition disabled:opacity-50 mt-2"
                >
                  {loading ? "Creating..." : "Create payment request"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <h1 className="font-display text-xl font-semibold text-slate-900 mb-2">
                Payment request created
              </h1>
              <p className="text-sm text-slate-500 mb-6">
                Share this link or QR code with your customer
              </p>

              <div className="flex justify-center mb-4">
                <img src={result.qrCode} alt="Scan to pay" className="w-48 h-48 rounded-lg border border-slate-200" />
              </div>

              <div className={`text-sm font-medium mb-4 ${isExpired ? "text-red-600" : "text-slate-500"}`}>
                {isExpired ? "This payment request has expired" : `Expires in ${countdown}`}
              </div>

              <div className="flex gap-2 mb-6">
                <input
                  readOnly
                  value={result.payLink}
                  className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 truncate"
                />
                <button
                  onClick={copyLink}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    copied ? "bg-emerald-600 text-white" : "bg-slate-800 hover:bg-slate-900 text-white"
                  }`}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="flex gap-3">
                <Link
                  to="/dashboard"
                  className="flex-1 border border-slate-200 rounded-lg py-3 font-semibold text-slate-700 hover:bg-slate-400 transition text-center"
                >
                  Back to dashboard
                </Link>
                
                
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}