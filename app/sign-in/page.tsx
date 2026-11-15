
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
    <main className="signin-page">
      <div className="signin-shell">
        <Link href="/" className="text-sm text-cyan-400">
          ← Back to homepage
        </Link>

        <div className="signin-card">
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
                className="signin-input"
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
                className="signin-input"
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
              className="signin-button"
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
