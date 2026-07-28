import { createFileRoute, useRouter, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign In — KK1 Core" },
      { name: "description", content: "Sign in or create an account to access the KK1 Core AGI strategic command center." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Sign In — KK1 Core" },
      { property: "og:description", content: "Sign in to KK1 Core — AGI strategic command center." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://ai2ai.lovable.app/auth" }],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : "",
  }),
  component: AuthPage,
});

function isSafeRelative(next: string): boolean {
  return next.startsWith("/") && !next.startsWith("//");
}

function AuthPage() {
  const router = useRouter();
  const { next } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeNext = next && isSafeRelative(next) ? next : "/";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace(safeNext);
    });
  }, [safeNext]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fn =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin + safeNext },
          });
    const { error: err } = await fn;
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    window.location.replace(safeNext);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
        <h1 className="mb-4 text-xl font-semibold text-foreground">
          KK1 Core — {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password (min 8)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {busy ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
