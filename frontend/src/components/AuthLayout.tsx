import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Left panel — hidden on mobile/tablet, visible lg and above */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-linear-to-br from-slate-950 via-indigo-950 to-teal-900">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="font-display text-2xl tracking-tight">PayGate</div>

          <div className="space-y-8">
            {/* signature: stacked payment cards, standing in for the "real" image */}
            <div className="relative h-40 w-64">
              <div className="absolute top-8 left-8 w-56 h-32 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm -rotate-6" />
              <div className="absolute top-4 left-4 w-56 h-32 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm -rotate-3" />
              <div className="absolute top-0 left-0 w-56 h-32 rounded-2xl bg-linear-to-br from-teal-400/90 to-indigo-500/90 shadow-xl flex flex-col justify-between p-4">
                <div className="flex justify-between items-start">
                  <div className="w-8 h-6 rounded bg-white/30" />
                  <div className="text-xs tracking-widest opacity-80">INR</div>
                </div>
                <div className="text-lg font-display tracking-widest">•••• 4092</div>
              </div>
            </div>

            <div>
              <h1 className="font-display text-3xl leading-tight mb-2">
                Get paid,<br />track every rupee.
              </h1>
              <p className="text-white/60 text-sm max-w-xs">
                Create payment requests, issue refunds, and track every notification attempt — all in one dashboard.
              </p>
            </div>
          </div>

          <div className="text-white/40 text-xs">© {new Date().getFullYear()} PayGate</div>
        </div>
      </div>

      {/* Right panel — the form, full width on mobile, half width on lg+ */}
      <div className="flex-1 flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}