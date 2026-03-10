"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-[400px] animate-fade-up-login">
      {/* Glassmorphic card */}
      <div className="login-card-wrapper login-card-shadow">
        <div className="login-card-inner px-10 py-10">
          {/* Brand */}
          <div className="mb-10 flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Voxaris AI"
              width={200}
              className="mb-3"
            />
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-500">
              Mission Control
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@voxaris.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="login-input h-10 rounded-lg border-zinc-800/80 bg-zinc-900/50 px-3.5 text-sm text-zinc-200 transition-all duration-200 placeholder:text-zinc-600 focus-visible:border-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-400/30"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="login-input h-10 rounded-lg border-zinc-800/80 bg-zinc-900/50 px-3.5 text-sm text-zinc-200 transition-all duration-200 placeholder:text-zinc-600 focus-visible:border-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-400/30"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="animate-error-slide-in rounded-lg border border-red-900/40 bg-red-950/20 px-3.5 py-2.5 backdrop-blur-sm">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="login-btn-glow mt-3 h-10 w-full rounded-lg bg-zinc-200 text-sm font-semibold text-zinc-950 transition-all duration-300 hover:bg-zinc-100 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-zinc-600">
        <Lock size={10} className="text-zinc-600" />
        <span>Voxaris AI</span>
        <span className="text-zinc-700">&middot;</span>
        <span>Secure Access</span>
      </div>
    </div>
  );
}
