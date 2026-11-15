
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (signInError) {
        setError("Sign-in failed. Check your email and password, then try again.");
        return;
      }

      router.replace("/school-access");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm text-cyan-400">
          ← Back to homepage
        </Link>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-xl">
          <div className="mb-7">
            <p className="text-cyan-400 font-bold tracking-widest text-sm">
              MICAN TECHNOLOGIES
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Welcome back
            </h1>

            <p className="mt-2 text-slate-400 text-sm">
              Sign in to MICAN SCHOOLS CONNECT.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm mb-2">
                Administrator email
              </label>

              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-2">
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-400 text-center">
            Don't have a school account?{" "}
            <Link
              href="/register-school"
              className="text-cyan-400 hover:underline"
            >
              Register your school
            </Link>
          </p>

          <p className="mt-5 text-xs text-slate-500 text-center">
            School access is subject to application approval.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          One Network. Many Schools. One Connected Future.
        </p>
      </div>
    </main>
  );
}
