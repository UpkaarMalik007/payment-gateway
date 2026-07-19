import { useState } from "react";
import { apiClient } from "../../api/client";

interface ShareData {
  payLink: string;
  qrCode: string;
}

export default function ShareLinkCard({
  paymentId,
  onExpired,
}: {
  paymentId: string;
  onExpired: () => void;
}) {
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function loadShareLink() {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/payments/${paymentId}/share`);
      setShareData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not generate share link");
      onExpired(); // tells the parent to refresh, in case status just changed
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!shareData) return;
    navigator.clipboard.writeText(shareData.payLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mt-4">
      <h2 className="font-semibold text-slate-900 mb-4">Share payment link</h2>

      {!shareData ? (
        <>
          <button
            onClick={loadShareLink}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
          >
            {loading ? "Loading..." : "Show link & QR code"}
          </button>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </>
      ) : (
        <div className="text-center">
          <img
            src={shareData.qrCode}
            alt="Scan to pay"
            className="w-40 h-40 rounded-lg border border-slate-200 mx-auto mb-4"
          />
          <div className="flex gap-2">
            <input
              readOnly
              value={shareData.payLink}
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
        </div>
      )}
    </div>
  );
}