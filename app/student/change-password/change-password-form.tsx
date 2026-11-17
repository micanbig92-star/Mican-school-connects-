
"use client";

import { useState, useTransition } from "react";
import { changeStudentPassword } from "./actions";

export default function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 12) {
      setMessage("Your new password must contain at least 12 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    const formData = new FormData();
    formData.set("password", password);
    formData.set("confirmPassword", confirmPassword);

    startTransition(async () => {
      const result = await changeStudentPassword(formData);

      if (result && !result.success) {
        setMessage(result.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          New password
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={12}
          maxLength={72}
          required
          placeholder="Create a new password"
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Confirm new password
        </label>

        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          minLength={12}
          maxLength={72}
          required
          placeholder="Enter the same password again"
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
        />
      </div>

      <p className="text-xs text-slate-400">
        Use at least 12 characters. Choose a password you can remember and
        do not share it with anyone.
      </p>

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
        disabled={
          isPending ||
          password.length < 12 ||
          !confirmPassword
        }
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Updating password..." : "Save New Password"}
      </button>
    </form>
  );
}
