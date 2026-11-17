"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createStudentLogin,
  getStudentTemporaryPassword,
} from "./student-account-actions";

type Result = {
  success: boolean;
  message: string;
  hasTemporaryPassword?: boolean;
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
  const [isLoading, setIsLoading] = useState(hasLogin);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!hasLogin) {
      setIsLoading(false);
      return;
    }

    let active = true;

    async function loadTemporaryPassword() {
      try {
        const response = await getStudentTemporaryPassword(
          schoolId,
          studentId,
        );

        if (active) {
          setResult(response);
        }
      } catch {
        if (active) {
          setResult({
            success: false,
            hasTemporaryPassword: false,
            message: "Unable to load the temporary password.",
          });
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadTemporaryPassword();

    return () => {
      active = false;
    };
  }, [schoolId, studentId, hasLogin]);

  function handleCreateAccount() {
    const formData = new FormData();
    formData.set("schoolId", schoolId);
    formData.set("studentId", studentId);

    startTransition(async () => {
      try {
        const response = await createStudentLogin(formData);
        setResult(response);
      } catch {
        setResult({
          success: false,
          message: "Unable to create the student login account.",
        });
      }
    });
  }

  if (isLoading) {
    return (
      <p className="text-sm text-gray-600">
        Checking student login details...
      </p>
    );
  }

  if (hasLogin) {
    return (
      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-semibold text-green-700">
          Student login account created
        </p>

        {result?.hasTemporaryPassword && (
          <div className="space-y-2 text-sm">
            <p>
              <strong>Student:</strong> {result.studentName}
            </p>

            <p>
              <strong>Username:</strong> {result.username}
            </p>

            <p>
              <strong>Temporary password:</strong>
            </p>

            <div className="break-all rounded-lg bg-gray-100 p-3 font-mono">
              {result.temporaryPassword}
            </div>

            <p className="text-xs text-gray-600">
              This temporary password remains visible to authorised school
              managers until the student successfully changes it.
            </p>
          </div>
        )}

        {result && !result.hasTemporaryPassword && (
          <p className="text-sm text-gray-600">
            {result.success
              ? "The student has changed their password, or no temporary password is available."
              : result.message}
          </p>
        )}
      </div>
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

          {result.success && result.temporaryPassword && (
            <div className="mt-3 space-y-2">
              <p>
                <strong>Student:</strong> {result.studentName}
              </p>

              <p>
                <strong>Username:</strong> {result.username}
              </p>

              <p>
                <strong>Temporary password:</strong>
              </p>

              <div className="break-all rounded bg-white p-3 font-mono">
                {result.temporaryPassword}
              </div>

              <p className="text-xs">
                Give these login details securely to the student.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}