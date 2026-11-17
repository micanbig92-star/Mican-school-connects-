
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";

type ClassroomCredentials = {
  token: string;
  serverUrl: string;
  roomName: string;
};

type SpeakingRequest = {
  id: string;
  studentId: string;
  schoolId: string;
  status: "pending" | "approved" | "revoked" | "denied";
  requestedAt: string;
  handledAt: string | null;
  studentName: string;
  admissionNumber: string;
  studentActive: boolean;
};

export default function ClassroomRoom({
  tutorialId,
}: {
  tutorialId: string;
}) {
  const [credentials, setCredentials] =
    useState<ClassroomCredentials | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState<SpeakingRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  async function joinClassroom() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/live-learning/teacher/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({ tutorialId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to enter the classroom."
        );
      }

      if (
        typeof result.token !== "string" ||
        typeof result.serverUrl !== "string" ||
        typeof result.roomName !== "string"
      ) {
        throw new Error(
          "The classroom service returned an invalid response."
        );
      }

      setCredentials({
        token: result.token,
        serverUrl: result.serverUrl,
        roomName: result.roomName,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const loadSpeakingRequests = useCallback(async () => {
    setRequestsLoading(true);
    setRequestsError("");

    try {
      const response = await fetch(
        `/api/live-learning/teacher/speaking-requests?tutorialId=${encodeURIComponent(
          tutorialId
        )}`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to load speaking requests."
        );
      }

      setRequests(
        Array.isArray(result.requests) ? result.requests : []
      );
    } catch (err) {
      setRequestsError(
        err instanceof Error
          ? err.message
          : "Could not load speaking requests."
      );
    } finally {
      setRequestsLoading(false);
    }
  }, [tutorialId]);

  useEffect(() => {
    if (!credentials) return;

    void loadSpeakingRequests();

    const interval = window.setInterval(() => {
      void loadSpeakingRequests();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [credentials, loadSpeakingRequests]);

  async function manageSpeakingRequest(
    requestId: string,
    action: "approve" | "revoke" | "deny"
  ) {
    setActionLoading(`${requestId}:${action}`);
    setActionMessage("");
    setRequestsError("");

    try {
      const response = await fetch(
        "/api/live-learning/teacher/manage-speaking-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({ requestId, action }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to update speaking permission."
        );
      }

      setActionMessage(result.message || "Request updated successfully.");
      await loadSpeakingRequests();
    } catch (err) {
      setRequestsError(
        err instanceof Error
          ? err.message
          : "Could not update the speaking request."
      );
    } finally {
      setActionLoading(null);
    }
  }

  const pendingCount = requests.filter(
    (request) => request.status === "pending"
  ).length;

  const approvedCount = requests.filter(
    (request) => request.status === "approved"
  ).length;

  if (credentials) {
    return (
      <section className="space-y-6">
        <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 px-4 py-3">
            <div>
              <p className="font-semibold">Live classroom</p>
              <p className="text-xs text-slate-400">
                Room: {credentials.roomName}
              </p>
            </div>

            <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs text-emerald-300">
              Connected session
            </span>
          </div>

          <div className="min-h-[520px] bg-black">
            <LiveKitRoom
              token={credentials.token}
              serverUrl={credentials.serverUrl}
              connect={true}
              video={true}
              audio={true}
              onError={(err) => {
                console.error("LiveKit classroom error:", err);
                setError(
                  "The classroom connection encountered a problem. Please check your camera, microphone and internet connection."
                );
              }}
              onDisconnected={() => {
                setCredentials(null);
              }}
              data-lk-theme="default"
              style={{ height: "min(75vh, 760px)" }}
            >
              <VideoConference />
            </LiveKitRoom>
          </div>

          {error ? (
            <p className="border-t border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-cyan-400">
                STUDENT MICROPHONE CONTROL
              </p>
              <h2 className="mt-2 text-xl font-bold">
                Speaking requests
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Approve students individually when you want them to speak.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadSpeakingRequests()}
              disabled={requestsLoading}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
            >
              {requestsLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-amber-900/60 bg-amber-950/30 p-4">
              <p className="text-sm text-amber-300">Pending requests</p>
              <p className="mt-1 text-2xl font-bold">{pendingCount}</p>
            </div>

            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/30 p-4">
              <p className="text-sm text-emerald-300">Approved requests</p>
              <p className="mt-1 text-2xl font-bold">{approvedCount}</p>
            </div>
          </div>

          {actionMessage ? (
            <p
              role="status"
              className="mt-4 rounded-lg border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-200"
            >
              {actionMessage}
            </p>
          ) : null}

          {requestsError ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200"
            >
              {requestsError}
            </p>
          ) : null}

          <div className="mt-5 space-y-3">
            {requests.length === 0 && !requestsLoading ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
                <p className="font-semibold text-slate-300">
                  No speaking requests yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Student requests will appear here.
                </p>
              </div>
            ) : null}

            {requests.map((request) => {
              const busy = actionLoading?.startsWith(
                `${request.id}:`
              );

              return (
                <article
                  key={request.id}
                  className="rounded-xl border border-slate-700 bg-slate-950 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">
                        {request.studentName}
                      </h3>

                      {request.admissionNumber ? (
                        <p className="mt-1 text-xs text-slate-400">
                          Admission number: {request.admissionNumber}
                        </p>
                      ) : null}

                      <p className="mt-1 text-xs text-slate-500">
                        Requested:{" "}
                        {new Date(request.requestedAt).toLocaleString()}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        request.status === "pending"
                          ? "bg-amber-950 text-amber-300"
                          : request.status === "approved"
                            ? "bg-emerald-950 text-emerald-300"
                            : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {request.status.toUpperCase()}
                    </span>
                  </div>

                  {!request.studentActive ? (
                    <p className="mt-3 text-xs text-red-300">
                      This student is no longer active. Permission cannot be granted.
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {request.status === "pending" ? (
                      <>
                        <button
                          type="button"
                          disabled={Boolean(busy) || !request.studentActive}
                          onClick={() =>
                            void manageSpeakingRequest(
                              request.id,
                              "approve"
                            )
                          }
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading === `${request.id}:approve`
                            ? "Approving..."
                            : "Approve microphone"}
                        </button>

                        <button
                          type="button"
                          disabled={Boolean(busy)}
                          onClick={() =>
                            void manageSpeakingRequest(
                              request.id,
                              "deny"
                            )
                          }
                          className="rounded-lg border border-red-800 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-950 disabled:opacity-50"
                        >
                          {actionLoading === `${request.id}:deny`
                            ? "Denying..."
                            : "Deny"}
                        </button>
                      </>
                    ) : null}

                    {request.status === "approved" ? (
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() =>
                          void manageSpeakingRequest(
                            request.id,
                            "revoke"
                          )
                        }
                        className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        {actionLoading === `${request.id}:revoke`
                          ? "Revoking..."
                          : "Revoke microphone"}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          <p className="mt-5 rounded-lg border border-cyan-900/50 bg-cyan-950/20 p-3 text-xs leading-5 text-cyan-200">
            Student permissions are controlled individually. Approval grants
            microphone audio only. Students do not receive camera or screen-sharing
            permission.
          </p>
        </section>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-8">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-cyan-950 text-3xl">
          🎥
        </div>

        <h2 className="mt-5 text-2xl font-bold">
          Enter your live classroom
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Join the scheduled lesson using your camera and microphone.
          You can control your devices after entering.
        </p>

        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-4 text-left">
          <p className="text-sm font-semibold text-slate-200">
            Before joining
          </p>

          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-400">
            <li>Use a stable internet connection.</li>
            <li>Allow camera and microphone access when prompted.</li>
            <li>Use headphones where possible to reduce echo.</li>
          </ul>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200"
          >
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={joinClassroom}
          disabled={loading}
          className="mt-7 w-full rounded-xl bg-cyan-600 px-6 py-4 font-bold text-white transition hover:bg-cyan-500 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? "Preparing classroom..." : "Join Live Classroom"}
        </button>

        <Link
          href="/live-learning/teacher"
          className="mt-5 inline-block text-sm text-slate-400 hover:text-white"
        >
          Return to Teacher Workspace
        </Link>
      </div>
    </section>
  );
}
