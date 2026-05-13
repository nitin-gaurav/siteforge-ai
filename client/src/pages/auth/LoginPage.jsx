import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Lock, Mail, Sparkles, WandSparkles } from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { isSupabaseConfigured, supabase } from "../../services/supabaseClient.js";

export default function LoginPage() {
  const { session, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (authLoading) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f4f2fb] text-ink">
        <div className="absolute inset-0 auth-soft-stage" />
        <div className="relative h-10 w-10 rounded-full border-4 border-[#d9d3f2] border-t-[#5b4bd1] animate-spin" aria-label="Loading" />
      </main>
    );
  }

  if (session) return <Navigate to="/" replace />;

  const isSignin = mode === "signin";

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setSuccess(false);
  }

  async function submit(event) {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Add real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values in client/.env, then restart the dev server.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    const action = isSignin
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });

    const { error: authError } = await action;
    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else if (!isSignin) {
      document.activeElement?.blur?.();
      setSuccess(true);
    } else {
      document.activeElement?.blur?.();
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f2fb] text-ink">
      <div className="absolute inset-0 auth-soft-stage" />
      <div className="auth-float-orb auth-float-orb-one absolute left-[13%] top-[8%] h-24 w-24 rounded-full bg-[#6657dc]/45" />
      <div className="auth-float-orb auth-float-orb-two absolute bottom-[16%] right-[11%] h-28 w-28 rounded-full bg-white/70 shadow-[0_18px_48px_rgba(77,63,148,0.10)]" />
      <div className="auth-float-orb auth-float-orb-three absolute bottom-[9%] left-[8%] h-20 w-20 rounded-full bg-[#d9d3f2]/65" />
      <div className="auth-particle auth-particle-one" />
      <div className="auth-particle auth-particle-two" />
      <div className="auth-particle auth-particle-three" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-3 py-4 sm:px-6 sm:py-8">
        <section
          className={`auth-shell ${
            isSignin ? "auth-mode-signin" : "auth-mode-signup"
          } grid w-full max-w-6xl overflow-hidden rounded-[22px] bg-white shadow-[0_26px_76px_rgba(58,48,112,0.14)] sm:rounded-[28px] lg:min-h-[600px] lg:grid-cols-2`}
        >
          <div className="auth-panel-left flex flex-col justify-center px-5 py-7 sm:px-10 lg:px-16">
            <div className="auth-stagger mb-5 flex items-center justify-center gap-3 sm:mb-6">
              <span className="auth-logo-badge flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f3f1fb] text-[#5648c8] shadow-sm transition-transform duration-200 hover:-translate-y-0.5 sm:h-11 sm:w-11">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <div>
                <p className="auth-brand-shimmer font-display text-base font-black sm:text-lg">SiteForge AI</p>
                <p className="text-xs font-bold text-muted">AI website builder workspace</p>
              </div>
            </div>

            <div className="mx-auto w-full max-w-sm">
              <div className="auth-stagger relative mb-5 grid grid-cols-2 rounded-2xl bg-[#f3f1fb] p-1.5 sm:mb-6">
                <span
                  className={`absolute bottom-1.5 top-1.5 w-[calc(50%-6px)] rounded-xl bg-white shadow-[0_10px_26px_rgba(77,63,148,0.14)] transition-transform duration-300 ease-spring ${
                    isSignin ? "translate-x-0" : "translate-x-[calc(100%+6px)]"
                  }`}
                />
                {[
                  ["signin", "Login"],
                  ["signup", "Sign up"]
                ].map(([nextMode, label]) => (
                  <button
                    key={nextMode}
                    type="button"
                    onClick={() => switchMode(nextMode)}
                    className={`relative z-10 h-10 rounded-xl text-sm font-black transition-colors duration-200 sm:h-11 ${
                      mode === nextMode
                        ? "text-ink"
                        : "text-slate-500 hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <header key={mode} className="auth-mode-swap text-center">
                <h1 className="font-display text-2xl font-black tracking-normal sm:text-3xl">
                  {isSignin ? "Welcome back" : "Create account"}
                </h1>
                <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                  {isSignin
                    ? "Welcome back. Continue building your next website."
                    : "Start your workspace and generate your first site."}
                </p>
              </header>

              <form onSubmit={submit} className="auth-stagger mt-5 grid gap-3.5 sm:mt-6 sm:gap-4">
                <div className="auth-form-row relative">
                  <Mail className="auth-input-icon pointer-events-none absolute left-5 top-[1.05rem] h-4 w-4 text-ink" />
                  <Input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="Email address"
                    className="h-12 rounded-2xl border border-transparent bg-[#f3f1fb] pl-12 font-semibold placeholder:text-slate-500/80 transition-all duration-200 hover:bg-[#efecf8] focus:border-[#6657dc] focus:bg-white focus:ring-4 focus:ring-[#6657dc]/12 sm:h-[52px]"
                  />
                </div>

                <div className="auth-form-row relative">
                  <Lock className="auth-input-icon pointer-events-none absolute left-5 top-[1.05rem] h-4 w-4 text-ink" />
                  <Input
                    type="password"
                    autoComplete={isSignin ? "current-password" : "new-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="Password"
                    className="h-12 rounded-2xl border border-transparent bg-[#f3f1fb] pl-12 font-semibold placeholder:text-slate-500/80 transition-all duration-200 hover:bg-[#efecf8] focus:border-[#6657dc] focus:bg-white focus:ring-4 focus:ring-[#6657dc]/12 sm:h-[52px]"
                  />
                </div>

                {error ? (
                  <div className="auth-alert-in rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                ) : null}

                {success ? (
                  <div className="auth-alert-in flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Check your email to confirm your account.</span>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="auth-submit mx-auto mt-1 h-12 min-w-36 rounded-2xl bg-[#5b4bd1] px-7 text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4f41bd] hover:shadow-md sm:h-[52px] sm:min-w-40 sm:px-8"
                  loading={loading}
                >
                  {isSignin ? "Login now" : "Create account"}
                  {!loading ? <ArrowRight className="h-4 w-4" /> : null}
                </Button>
              </form>

              <p className="auth-stagger mt-5 text-center text-xs font-semibold leading-5 text-muted">
                Use the tabs above to switch between login and account creation.
              </p>
            </div>
          </div>

          <div className="auth-panel-right relative hidden overflow-hidden bg-[#5648c8] p-10 text-white lg:block">
            <div className="absolute inset-0 auth-purple-panel" />
            <div className="auth-panel-sheen absolute inset-y-0 -left-1/3 w-1/3 rotate-12 bg-white/10" />
            <div className="auth-ring auth-ring-one absolute -right-12 -top-12 h-40 w-40 rounded-full border-[28px] border-white/10" />
            <div className="auth-ring auth-ring-two absolute -bottom-20 left-16 h-72 w-72 rounded-full border-[34px] border-white/10" />
            <div className="auth-pulse-dot absolute bottom-9 right-9 h-20 w-20 rounded-full bg-white/90" />

            <div className="relative z-10 flex h-full items-center justify-center">
              <div className="auth-preview-card relative h-[400px] w-[340px] rounded-[34px] border border-white/40 bg-white/10 shadow-[0_22px_58px_rgba(27,18,116,0.16)]">
                <div className="auth-preview-layer auth-preview-layer-one absolute inset-x-8 top-8 rounded-3xl bg-white p-4 text-ink shadow-[0_18px_42px_rgba(31,23,114,0.16)]">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f3f1fb] text-[#5648c8]">
                      <WandSparkles className="h-5 w-5" />
                    </span>
                    <span className="auth-live-pill rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600">Live</span>
                  </div>
                  <p className="font-display text-2xl font-black leading-tight">Generate a premium SaaS homepage</p>
                  <div className="mt-5 grid gap-2">
                    <span className="auth-line-grow h-2 rounded-full bg-slate-200" />
                    <span className="auth-line-grow auth-line-grow-short h-2 w-4/5 rounded-full bg-slate-200" />
                  </div>
                </div>

                <div className="auth-preview-layer auth-preview-layer-two absolute bottom-8 left-8 right-8 rounded-3xl bg-[#17142b] p-4 shadow-[0_18px_42px_rgba(31,23,114,0.18)]">
                  <div className="auth-code-glow absolute inset-x-5 top-4 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    <span className="auth-bar h-16 rounded-2xl bg-[#cfd6e6]" />
                    <span className="auth-bar auth-bar-mid h-16 rounded-2xl bg-[#aeb8d7]" />
                    <span className="auth-bar auth-bar-end h-16 rounded-2xl bg-[#d9d3f2]" />
                  </div>
                  <div className="h-3 w-28 rounded-full bg-white" />
                  <div className="mt-3 h-2 rounded-full bg-white/25" />
                  <div className="mt-2 h-2 w-2/3 rounded-full bg-white/20" />
                </div>

                <div className="auth-spark-bubble absolute -left-8 top-[44%] flex h-20 w-20 items-center justify-center rounded-full bg-white/95 text-[#5648c8] shadow-[0_14px_32px_rgba(31,23,114,0.16)]">
                  <Sparkles className="h-8 w-8" />
                </div>

                <div className="auth-ready-chip absolute -right-8 bottom-24 rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink shadow-[0_16px_38px_rgba(31,23,114,0.16)]">
                  12 sections ready
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
