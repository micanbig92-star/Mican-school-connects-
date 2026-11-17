"use client";

import { useState, useTransition } from "react";
import { createStudentLogin } from "./student-account-actions";

type Result = {
  success: boolean;
  message: string;
  studentName?: string;
  username?: string;
  temporaryPassword?: string;
};

type Props = {
  schoolId: string;
  studentId: string;
  hasLogin: boolean;
};

export default function StudentLoginControls({
  schoolId,
  studentId,
  hasLogin,
}: Props) {
  const [result, setResult] = useState<Result | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreateAccount() {
    const formData = new FormData();
    formData.set("schoolId", schoolId);
    formData.set("studentId", studentId);

    startTransition(async () => {
      const response = await createStudentLogin(formData);
      setResult(response);
    });
  }

  if (hasLogin) {
    return (
      <span className="text-sm text-green-700 font-medium">
        Login account created
      </span>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleCreateAccount}
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "Creating account..." : "Create Student Login"}
      </button>

      {result && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            result.success
              ? "border-green-300 bg-green-50 text-green-900"
              : "border-red-300 bg-red-50 text-red-900"
          }`}
        >
          <p className="font-semibold">{result.message}</p>

          {result.success && (
            <div className="mt-3 space-y-2">
              <p>
                **Student:** {result.studentName}
              </p>

              <p>
                **Username:** {result.username}
              </p>

              <p>
                **Temporary password:**
              </p>

              <div className="break-all rounded bg-white p-3 font-mono">
                {result.temporaryPassword}
              </div>

              <p className="mt-2 text-xs">
                Give these login details securely to the student. Save the
                temporary password now; it will disappear if this page is
                refreshed or closed.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}