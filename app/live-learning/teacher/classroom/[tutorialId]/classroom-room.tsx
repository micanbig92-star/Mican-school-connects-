
"use client";

import { useState } from "react";
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

export default function ClassroomRoom({
  tutorialId,
}: {
  tutorialId: string;
}) {
  const [credentials, setCredentials] =
    useState<ClassroomCredentials | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        throw new Error("The classroom service returned an invalid response.");
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

  if (credentials) {
    return (
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
