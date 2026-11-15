
"use client";

import { useState } from "react";
import Link from "next/link";

export default function TeacherRegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subjectSpecialisation, setSubjectSpecialisation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 10 || password.length > 72) {
      setError("Your password must contain 10–72 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/live-learning/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          subjectSpecialisation,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.message || "Registration failed. Please try again."
        );
        return;
      }

      setSuccess(
        result.message ||
          "Your teacher application has been received and is awaiting approval."
      );

      setFullName("");
      setEmail("");
      setPhone("");
      setSubjectSpecialisation("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Unable to connect. Please check your internet connection and try again.");
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
              Teacher Registration
            </h1>

            <p className="mt-2 text-slate-400 text-sm">
              Apply to become an approved MICAN Live Learning teacher.
            </p>
          </div>

          {success ? (
            <div className="space-y-5">
              <div
                role="status"
                className="rounded-lg border border-emerald-700 bg-emerald-950/40 p-4"
              >
                <h2 className="font-bold text-emerald-400">
                  Application received
                </h2>
                <p className="mt-2 text-sm text-slate-200">
                  {success}
                </p>
                <p className="mt-3 text-sm text-slate-400">
                  You cannot access teacher features until the MICAN Super Admin approves your application.
                </p>
              </div>

              <Link
                href="/live-learning/sign-in"
                className="block text-center text-cyan-400 hover:underline"
              >
                Go to teacher sign-in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm mb-2">
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={160}
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Enter your full name"
                  className="signin-input"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email address"
                  className="signin-input"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm mb-2">
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  minLength={7}
                  maxLength={40}
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Enter your phone number"
                  className="signin-input"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm mb-2"
                >
                  Subject specialisation
                </label>
                <input
                  id="subject"
                  type="text"
                  maxLength={160}
                  required
                  value={subjectSpecialisation}
                  onChange={(event) =>
                    setSubjectSpecialisation(event.target.value)
                  }
                  placeholder="e.g. Mathematics, Physics, English"
                  className="signin-input"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm mb-2">
                  Create password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={10}
                  maxLength={72}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a password (10–72 characters)"
                  className="signin-input"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm mb-2"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={10}
                  maxLength={72}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Enter your password again"
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
                {loading ? "Submitting application..." : "Create teacher account"}
              </button>

              <p className="text-xs text-slate-500 text-center">
                No email verification is required. Your teacher account
                remains pending until the MICAN Super Admin approves it.
              </p>
            </form>
          )}

          <p className="mt-6 text-sm text-slate-400 text-center">
            Already registered?{" "}
            <Link
              href="/live-learning/sign-in"
              className="text-cyan-400 hover:underline"
            >
              Teacher sign in
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
