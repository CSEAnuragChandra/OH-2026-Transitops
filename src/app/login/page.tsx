"use client";
// src/app/login/page.tsx
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Truck, Eye, EyeOff, Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    toast.success("Logged in successfully!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "var(--bg)" }}>
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--brand-600)" }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: "#7c3aed" }} />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="rounded-2xl p-8 shadow-2xl border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--fg)" }}>TransitOps</h1>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Smart Transport Operations</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--fg)" }}>
            Welcome back
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--fg-muted)" }}>
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Email address
              </label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="you@transitops.com"
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all
                  focus:ring-2 focus:ring-blue-500 border"
                style={{
                  background: "var(--bg)",
                  borderColor: errors.email ? "var(--danger)" : "var(--border)",
                  color: "var(--fg)",
                }}
              />
              {errors.email && (
                <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--fg)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all
                    focus:ring-2 focus:ring-blue-500 border"
                  style={{
                    background: "var(--bg)",
                    borderColor: errors.password ? "var(--danger)" : "var(--border)",
                    color: "var(--fg)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted)" }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all
                hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-center gap-2 gradient-brand">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 rounded-lg text-xs space-y-1 border"
            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg-muted)" }}>
            <p className="font-semibold mb-1" style={{ color: "var(--fg)" }}>Demo credentials:</p>
            <p>Fleet Manager: <code>fleet@transitops.com</code> / <code>Fleet@123</code></p>
            <p>Dispatcher: <code>dispatch@transitops.com</code> / <code>Dispatch@123</code></p>
            <p>Safety Officer: <code>safety@transitops.com</code> / <code>Safety@123</code></p>
            <p>Fin. Analyst: <code>finance@transitops.com</code> / <code>Finance@123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
