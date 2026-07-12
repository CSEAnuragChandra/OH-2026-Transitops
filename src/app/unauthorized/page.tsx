// src/app/unauthorized/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { ShieldX, ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Access Denied | TransitOps" };

export default function UnauthorizedPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg)" }}
    >
      {/* Background accent */}
      <div
        className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: "#ef4444" }}
      />

      <div className="relative z-10 text-center max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-red-500/10 border border-red-500/20">
            <ShieldX className="w-10 h-10 text-red-400" />
          </div>
        </div>

        <p className="text-6xl font-black mb-4" style={{ color: "var(--fg)" }}>
          403
        </p>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--fg)" }}>
          Access Denied
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--fg-muted)" }}>
          You don&apos;t have permission to view this page. Please contact your
          administrator if you believe this is a mistake.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 gradient-brand"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
