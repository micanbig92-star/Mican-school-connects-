
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  GridLayout,
  ParticipantTile,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

type Credentials = {
  token: string;
  serverUrl: string;
  roomName: string;
};

function TeacherVideo() {
  const cameraTracks = useTracks([Track.Source.Camera]);

  return (
    <div className="min-h-[320px] overflow-hidden rounded-xl bg-black">
      {cameraTracks.length > 0 ? (
        <GridLayout
          tracks={cameraTracks}
          className="h-[min(65vh,620px)]"
        >
          <ParticipantTile />
        </GridLayout>
      ) : (
        <div className="grid min-h-[320px] place-items-center p-6 text-center">
          <div>
            <div className="text-5xl">🎥</div>
            <p className="mt-4 font-semibold text-white">
              Waiting for the teacher's video
            </p>
            <p className="mt-2 text-sm text-slate-400">
              The teacher's video will appear here when the camera is on.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentClassroomRoom({
  tutorialId,
}: {
  tutorialId: string;
}) {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function joinClassroom() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/live-learning/student/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ tutorialId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to enter the live classroom."
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 p-4">
          <div>
            <h2 className="font-bold text-white">MICAN Live Classroom</h2>
            <p className="mt-1 text-xs text-slate-400">
              Room: {credentials.roomName}
            </p>
          </div>

          <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-300">
            Connected
          </span>
        </div>

        <div className="space-y-4 p-3 sm:p-5">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-semibold text-white">Teacher's live video</h3>
              <span className="text-xs text-emerald-300">
                ● Live session
              </span>
            </div>

            <LiveKitRoom
              token={credentials.token}
              serverUrl={credentials.serverUrl}
              connect={true}
              video={false}
              audio={false}
              onError={(err) => {
                console.error("Student classroom error:", err);
                setError(
                  "The classroom connection encountered a problem. Please try again."
                );
              }}
              onDisconnected={() => {
                setCredentials(null);
              }}
              data-lk-theme="default"
              style={{ minHeight: "360px" }}
            >
              <RoomAudioRenderer />
              <TeacherVideo />
            </LiveKitRoom>
          </div>

          <div className="rounded-xl border border-blue-900 bg-blue-950/40 p-4">
            <p className="font-semibold text-blue-200">
              Your microphone is currently disabled
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              You can watch the teacher and hear the lesson. You will be able
              to speak only when the teacher gives you permission.
            </p>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="border-t border-red-900 bg-red-950/40 p-3 text-sm text-red-200"
          >
            {error}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:p-8">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-950 text-3xl">
          🎥
        </div>

        <h2 className="mt-5 text-2xl font-bold text-white">
          Join the live lesson
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Watch your teacher teach live and listen to the lesson directly
          from your device.
        </p>

        <div className="mt-6 space-y-3 text-left">
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <p className="font-semibold text-white">Teacher's video</p>
            <p className="mt-1 text-sm text-slate-400">
              You can watch the teacher's live camera.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <p className="font-semibold text-white">Teacher's audio</p>
            <p className="mt-1 text-sm text-slate-400">
              You can hear the teacher explaining the lesson.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <p className="font-semibold text-white">Your microphone</p>
            <p className="mt-1 text-sm text-slate-400">
              It stays disabled until your teacher approves you to speak.
            </p>
          </div>
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
          className="mt-7 w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? "Preparing classroom..." : "Join Live Classroom"}
        </button>

        <Link
          href="/student/dashboard"
          className="mt-5 inline-block text-sm text-slate-400 hover:text-white"
        >
          Return to Student Dashboard
        </Link>
      </div>
    </section>
  );
}
