import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Lock, Mail, Sparkles, WandSparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    return <div className="flex min-h-screen items-center justify-center bg-[#f4f2fb] font-semibold text-ink">Restoring session...</div>;
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
      setSuccess(true);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f2fb] text-ink">
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 auth-soft-stage"
      />
      <motion.div
        animate={{ y: [0, -30, 0], x: [0, 20, 0], rotate: [0, 90, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[10%] top-[10%] h-32 w-32 rounded-full bg-gradient-to-br from-[#6657dc]/30 to-[#d9d3f2]/30 blur-2xl"
      />
      <motion.div
        animate={{ y: [0, 40, 0], x: [0, -30, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[20%] right-[10%] h-40 w-40 rounded-full bg-gradient-to-tr from-white/60 to-white/10 blur-xl shadow-[0_18px_48px_rgba(77,63,148,0.10)]"
      />
      <motion.div
        animate={{ y: [0, -20, 0], scale: [1, 1.1, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[10%] left-[15%] h-24 w-24 rounded-full bg-gradient-to-br from-[#d9d3f2]/40 to-[#5648c8]/20 blur-lg"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-5 sm:px-6 sm:py-8">
        <motion.section
          initial={{ opacity: 0, scale: 0.9, y: 40, rotateX: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], type: "spring", bounce: 0.2 }}
          style={{ transformPerspective: 1000 }}
          className="flex w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_26px_76px_rgba(58,48,112,0.14)] lg:min-h-[600px] lg:flex-row"
        >
          <div 
            className={`flex w-full flex-col justify-center px-6 py-8 sm:px-10 lg:w-1/2 lg:px-16 transition-transform duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isSignin ? "lg:translate-x-0" : "lg:translate-x-full"
            }`}
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6 flex items-center justify-center gap-3"
            >
              <motion.span
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3f1fb] text-[#5648c8] shadow-sm transition-transform duration-200"
              >
                <Sparkles className="h-5 w-5" />
              </motion.span>
              <div>
                <motion.p 
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="font-display text-lg font-black bg-gradient-to-r from-[#5648c8] via-[#a397f8] to-[#5648c8] bg-[length:200%_auto] bg-clip-text text-transparent"
                >
                  SiteForge AI
                </motion.p>
                <p className="text-xs font-bold text-muted">AI website builder workspace</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mx-auto w-full max-w-sm"
            >
              <div className="relative mb-6 grid grid-cols-2 rounded-2xl bg-[#f3f1fb] p-1.5">
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
                    className={`relative z-10 h-11 rounded-xl text-sm font-black transition-colors duration-200 ${
                      mode === nextMode
                        ? "text-ink"
                        : "text-slate-500 hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.header
                  key={mode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <h1 className="font-display text-3xl font-black tracking-normal flex justify-center gap-[0.25em] flex-wrap">
                    {(isSignin ? "Welcome back" : "Create account").split(" ").map((word, wordIdx) => (
                      <div key={wordIdx} className="overflow-hidden flex">
                        {word.split("").map((char, charIdx) => (
                          <motion.span
                            key={charIdx}
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            transition={{
                              duration: 0.6,
                              ease: [0.16, 1, 0.3, 1],
                              delay: 0.3 + (wordIdx * 5 + charIdx) * 0.03
                            }}
                            className="inline-block"
                          >
                            {char}
                          </motion.span>
                        ))}
                      </div>
                    ))}
                  </h1>
                  <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                    {isSignin
                      ? "Welcome back. Continue building your next website."
                      : "Start your workspace and generate your first site."}
                  </p>
                </motion.header>
              </AnimatePresence>

              <motion.form
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.4,
                    },
                  },
                }}
                onSubmit={submit}
                className="mt-6 grid gap-4"
              >
                <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }} className="relative">
                  <Mail className="pointer-events-none absolute left-5 top-[1.05rem] h-4 w-4 text-ink" />
                  <Input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="Email address"
                    className="h-[52px] rounded-2xl border border-transparent bg-[#f3f1fb] pl-12 font-semibold placeholder:text-slate-500/80 transition-all duration-200 hover:bg-[#efecf8] focus:border-[#6657dc] focus:bg-white focus:ring-4 focus:ring-[#6657dc]/12"
                  />
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }} className="relative">
                  <Lock className="pointer-events-none absolute left-5 top-[1.05rem] h-4 w-4 text-ink" />
                  <Input
                    type="password"
                    autoComplete={isSignin ? "current-password" : "new-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="Password"
                    className="h-[52px] rounded-2xl border border-transparent bg-[#f3f1fb] pl-12 font-semibold placeholder:text-slate-500/80 transition-all duration-200 hover:bg-[#efecf8] focus:border-[#6657dc] focus:bg-white focus:ring-4 focus:ring-[#6657dc]/12"
                  />
                </motion.div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>Check your email to confirm your account.</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }} className="flex justify-center">
                  <Button
                    type="submit"
                    className="group mt-1 flex h-[52px] min-w-40 items-center justify-center rounded-2xl bg-[#5b4bd1] px-8 text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4f41bd] hover:shadow-md"
                    loading={loading}
                  >
                    {isSignin ? "Login now" : "Create account"}
                    {!loading ? <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" /> : null}
                  </Button>
                </motion.div>
              </motion.form>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-5 text-center text-xs font-semibold leading-5 text-muted"
              >
                Use the tabs above to switch between login and account creation.
              </motion.p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`relative hidden w-full overflow-hidden bg-[#5648c8] p-10 text-white lg:block lg:w-1/2 z-10 transition-transform duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] shadow-2xl ${
              isSignin ? "lg:translate-x-0" : "lg:-translate-x-full"
            }`}
          >
            <div className="absolute inset-0 auth-purple-panel" />
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{ 
                rotate: { duration: 60, repeat: Infinity, ease: "linear" },
                scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-[28px] border-white/20 border-t-white/40 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            />
            <motion.div
              animate={{ rotate: -360, scale: [1, 1.05, 1] }}
              transition={{ 
                rotate: { duration: 80, repeat: Infinity, ease: "linear" },
                scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute -bottom-20 left-16 h-72 w-72 rounded-full border-[34px] border-white/10 border-b-white/30 shadow-[0_0_60px_rgba(255,255,255,0.1)]"
            />
            <motion.div
              animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-9 right-9 h-20 w-20 rounded-full bg-white/90"
            />

            <div className="relative z-10 flex h-full items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotateY: 15, rotateX: 5 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  rotateY: [15, 5, 10, 15], 
                  rotateX: [5, 0, 5, 5],
                  y: [0, -10, 0]
                }}
                transition={{ 
                  opacity: { duration: 0.8, delay: 0.4 },
                  scale: { duration: 0.8, delay: 0.4, type: "spring", bounce: 0.4 },
                  rotateY: { duration: 10, repeat: Infinity, ease: "linear" },
                  rotateX: { duration: 8, repeat: Infinity, ease: "linear" },
                  y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
                }}
                style={{ transformStyle: "preserve-3d", transformPerspective: 1000 }}
                className="relative h-[400px] w-[340px] rounded-[34px] border border-white/28 bg-white/12 shadow-[0_22px_58px_rgba(27,18,116,0.16)] backdrop-blur-md"
              >
                <motion.div
                  initial={{ opacity: 0, y: -20, translateZ: 40 }}
                  animate={{ opacity: 1, y: 0, translateZ: 40 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="absolute inset-x-8 top-8 rounded-3xl bg-white p-4 text-ink shadow-[0_30px_60px_rgba(31,23,114,0.3)]"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f3f1fb] text-[#5648c8]">
                      <WandSparkles className="h-5 w-5" />
                    </span>
                    <motion.span
                      animate={{ opacity: [1, 0.6, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600"
                    >
                      Live
                    </motion.span>
                  </div>
                  <p className="font-display text-2xl font-black leading-tight">Generate a premium SaaS homepage</p>
                  <div className="mt-5 grid gap-2">
                    <motion.span
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1, delay: 1 }}
                      className="h-2 rounded-full bg-slate-200"
                    />
                    <motion.span
                      initial={{ width: "0%" }}
                      animate={{ width: "80%" }}
                      transition={{ duration: 1, delay: 1.2 }}
                      className="h-2 w-4/5 rounded-full bg-slate-200"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20, translateZ: 60 }}
                  animate={{ opacity: 1, y: 0, translateZ: 60 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="absolute bottom-8 left-8 right-8 rounded-3xl bg-[#17142b] p-4 shadow-[0_30px_60px_rgba(31,23,114,0.4)]"
                >
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    <motion.span
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      className="h-16 origin-bottom rounded-2xl bg-[#cfd6e6]"
                    />
                    <motion.span
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                      className="h-16 origin-bottom rounded-2xl bg-[#aeb8d7]"
                    />
                    <motion.span
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.5, delay: 1.0 }}
                      className="h-16 origin-bottom rounded-2xl bg-[#d9d3f2]"
                    />
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.1 }}
                    className="h-3 w-28 rounded-full bg-white"
                  />
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.2 }}
                    className="mt-3 h-2 rounded-full bg-white/25"
                  />
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.3 }}
                    className="mt-2 h-2 w-2/3 rounded-full bg-white/20"
                  />
                </motion.div>

                <motion.div
                  initial={{ translateZ: 80 }}
                  animate={{ y: [0, -15, 0], translateZ: 80 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-8 top-[44%] flex h-20 w-20 items-center justify-center rounded-full bg-white/95 text-[#5648c8] shadow-[0_20px_40px_rgba(31,23,114,0.3)]"
                >
                  <Sparkles className="h-8 w-8" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20, translateZ: 50 }}
                  animate={{ opacity: 1, x: 0, y: [0, -8, 0], translateZ: 50 }}
                  transition={{
                    opacity: { duration: 0.5, delay: 0.9 },
                    x: { duration: 0.5, delay: 0.9 },
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.4 }
                  }}
                  className="absolute -right-8 bottom-24 rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink shadow-[0_20px_40px_rgba(31,23,114,0.25)]"
                >
                  12 sections ready
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </main>
  );
}

