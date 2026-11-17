
"use client";

import { FormEvent, useState } from "react";

export default function StudentSignInPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/student/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setMessage(result.message || "Sign-in failed. Check your details.");
        return;
      }

      if (
        result.redirectTo !== "/student/change-password" &&
        result.redirectTo !== "/student/dashboard"
      ) {
        setMessage("Unable to open your student account.");
        return;
      }

      window.location.assign(result.redirectTo);
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold tracking-widest text-blue-400">
            MICAN SCHOOLS CONNECT
          </p>

          <h1 className="mt-4 text-3xl font-bold text-white">
            Student Sign-in
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Sign in with the login details provided by your school.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Student username
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="MSC-XXXXXXXX/Admission Number"
              autoComplete="username"
              required
              maxLength={100}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            <p className="mt-2 text-xs text-slate-400">
              Example format: MSC-1234ABCD/2026-001
            </p>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              maxLength={72}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          {message && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Your student login is managed by your school.
        </p>
      </div>
    </main>
  );
}
