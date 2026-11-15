
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TeacherSignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
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
        setError(
          "Sign-in failed. Check your email and password, then try again."
        );
        return;
      }

      // The protected teacher page will check approval on the server.
      router.replace("/live-learning/teacher");
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
              Teacher Sign In
            </h1>

            <p className="mt-2 text-slate-400 text-sm">
              Sign in to your MICAN Live Learning teacher account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm mb-2">
                Teacher email
              </label>

              <input
                id="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your registered email"
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
              style={{
                display: "block",
                visibility: "visible",
                width: "100%",
                minHeight: "50px",
                padding: "14px 16px",
                color: "#ffffff",
                background: "linear-gradient(110deg, #102b4d, #087f83)",
                border: "none",
                borderRadius: "9px",
                fontSize: "16px",
                fontWeight: 700,
                opacity: loading ? 0.65 : 1,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <p className="text-xs text-slate-500 text-center">
              Teacher dashboard access is available only after MICAN
              Super Admin approval.
            </p>
          </form>

          <p className="mt-6 text-sm text-slate-400 text-center">
            Not registered yet?{" "}
            <Link
              href="/live-learning/register"
              className="text-cyan-400 hover:underline"
            >
              Apply as a teacher
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          MICAN LIVE LEARNING
          <br />
          One Network. Many Schools. One Connected Future.
        </p>
      </div>
    </main>
  );
}
