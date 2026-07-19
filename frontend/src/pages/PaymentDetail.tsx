import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiClient } from "../api/client";
import PaymentSummaryCard from "../components/payment-detail/PaymentSummaryCard";
import ShareLinkCard from "../components/payment-detail/ShareLinkCard";
import RefundForm from "../components/payment-detail/RefundForm";
import RefundHistory from "../components/payment-detail/RefundHistory";
import NotificationHistory from "../components/payment-detail/NotificationHistory";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface Refund {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
}

interface Notification {
  id: string;
  event_type: string;
  status: string;
  attempt_count: number;
  last_attempt_at: string | null;
  created_at: string;
}

export default function PaymentDetail() {
  const { id } = useParams();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);      
  const [refreshing, setRefreshing] = useState(false); 

  useEffect(() => {
    loadAll(true); 
    const interval = setInterval(() => loadAll(false), 15000); 
    return () => clearInterval(interval);
  }, [id]);

  async function loadAll(isInitial = false) {
    if (isInitial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const [paymentRes, refundsRes, notificationsRes] = await Promise.all([
      apiClient.get(`/payments/${id}`),
      apiClient.get(`/payments/${id}/refunds`),
      apiClient.get(`/payments/${id}/notifications`),
    ]);

    setPayment(paymentRes.data);
    setRefunds(refundsRes.data);
    setNotifications(notificationsRes.data);

    setLoading(false);
    setRefreshing(false);
  }

  if (loading || !payment) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  }

  const totalRefunded = refunds.reduce((sum, r) => sum + r.amount, 0);
  const remaining = payment.amount - totalRefunded;
  const canRefund = payment.status === "completed" || payment.status === "partially_refunded";

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center">
          <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to dashboard
          </Link>

          <div className="flex items-center gap-2">
            {refreshing && (
              <span className="text-xs text-slate-400">● updating</span>
            )}
            <button
              onClick={() => loadAll(false)}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <PaymentSummaryCard payment={payment} totalRefunded={totalRefunded} remaining={remaining} />

        {payment.status === "pending" && (
          <ShareLinkCard paymentId={payment.id} onExpired={() => loadAll(false)} />
        )}

        {canRefund && (
          <RefundForm paymentId={payment.id} remaining={remaining} onRefundSuccess={() => loadAll(false)} />
        )}

        <RefundHistory refunds={refunds} />
        <NotificationHistory notifications={notifications} />
      </div>
    </div>
  );
}