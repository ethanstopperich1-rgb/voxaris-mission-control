"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hexagon, Loader2 } from "lucide-react";
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
    <div className="w-full max-w-sm animate-fade-up">
      {/* Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-2xl shadow-black/40">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 border border-gold/20">
            <Hexagon size={24} className="text-gold" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-50">
            VOXARIS
          </h1>
          <p className="mt-1 text-xs font-medium text-gold-dim">
            Mission Control
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs font-medium text-zinc-400"
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
              className="bg-zinc-900/60 border-zinc-800 focus-visible:ring-gold/40 placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-xs font-medium text-zinc-400"
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
              className="bg-zinc-900/60 border-zinc-800 focus-visible:ring-gold/40 placeholder:text-zinc-600"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2"
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

      {/* Footer */}
      <p className="mt-6 text-center text-[11px] text-zinc-600">
        Voxaris AI &middot; Secure Access
      </p>
    </div>
  );
}
