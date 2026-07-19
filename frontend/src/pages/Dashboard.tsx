import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  customer_name: string;
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

export default function Dashboard() {
  const { merchant, logout } = useAuth();
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);       
  const [refreshing, setRefreshing] = useState(false); 

 
  useEffect(() => {
    fetchAllPayments(true);
    const interval = setInterval(() => fetchAllPayments(false), 15000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    fetchFilteredPayments(true);
    const interval = setInterval(() => fetchFilteredPayments(false), 15000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  async function fetchAllPayments(isInitial = false) {
    if (!isInitial) setRefreshing(true);
    const res = await apiClient.get("/payments");
    setAllPayments(res.data);
    setRefreshing(false);
  }

  async function fetchFilteredPayments(isInitial = false) {
    if (isInitial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    const query = statusFilter ? `?status=${statusFilter}` : "";
    const res = await apiClient.get(`/payments${query}`);
    setFilteredPayments(res.data);
    setLoading(false);
    setRefreshing(false);
  }

  const totalCollected = allPayments
    .filter((p) => p.status === "completed" || p.status === "partially_refunded" || p.status === "refunded")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = allPayments.filter((p) => p.status === "pending").length;
  const completedCount = allPayments.filter((p) => p.status === "completed").length;
  const totalCount = allPayments.length;
  const expiredCount = allPayments.filter((p) => p.status === "expired").length;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-display text-xl font-semibold text-slate-900">PayGate</h1>
          <p className="text-sm text-slate-500">Welcome back, {merchant?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {refreshing && <span className="text-xs text-slate-400">● updating</span>}
          <Link
            to="/payments/new"
            className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-semibold transition"
          >
            + Create payment
          </Link>
          <button
            onClick={logout}
            className="border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500 mb-1">Total collected</p>
            <p className="text-2xl font-display font-semibold text-slate-900">{formatINR(totalCollected)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500 mb-1">Total payments</p>
            <p className="text-2xl font-display font-semibold text-slate-900">{totalCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500 mb-1">Completed</p>
            <p className="text-2xl font-display font-semibold text-emerald-600">{completedCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500 mb-1">Pending</p>
            <p className="text-2xl font-display font-semibold text-amber-600">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500 mb-1">Expired</p>
            <p className="text-2xl font-display font-semibold text-slate-400">{expiredCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex justify-between items-center p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Payments</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="partially_refunded">Partially refunded</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-slate-400">Loading...</p>
          ) : filteredPayments.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">
              {statusFilter ? `No ${statusFilter.replace("_", " ")} payments.` : "No payments yet. Create your first one."}
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPayments.map((p) => (
                <Link
                  to={`/payments/${p.id}`}
                  key={p.id}
                  className="flex justify-between items-center px-4 py-3 hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="font-medium text-slate-900">{p.customer_name}</p>
                    <p className="text-xs text-slate-400">{new Date(p.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">{formatINR(p.amount)}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[p.status] || "bg-slate-100 text-slate-600"}`}>
                      {p.status.replace("_", " ")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}