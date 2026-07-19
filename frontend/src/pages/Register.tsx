import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiClient } from "../api/client";
import AuthLayout from "../components/AuthLayout";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiClient.post("/auth/register", { name, email, password });
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center lg:text-left">
          <h2 className="font-display text-2xl font-semibold text-slate-900">PayGate</h2>
          <p className="text-slate-500 mt-1">Create your merchant account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-1 block">Name</label>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg bg-slate-100 border border-transparent focus:border-teal-500 focus:bg-white px-4 py-3 text-sm outline-none transition"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800 mb-1 block">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-100 border border-transparent focus:border-teal-500 focus:bg-white px-4 py-3 text-sm outline-none transition"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800 mb-1 block">Password</label>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-100 border border-transparent focus:border-teal-500 focus:bg-white px-4 py-3 text-sm outline-none transition"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-lg py-3 font-semibold transition disabled:opacity-50 mt-2"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 tracking-wide">OR LOG IN</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <Link
          to="/login"
          className="block text-center w-full border border-slate-200 rounded-lg py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          I already have an account
        </Link>
      </div>
    </AuthLayout>
  );
}