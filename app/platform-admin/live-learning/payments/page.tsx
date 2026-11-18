
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPlatformAdmin } from "@/lib/supabase/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  approveTutorialPayment,
  rejectTutorialPayment,
} from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ review?: string }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  });
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || "NGN"} ${Number(amount).toLocaleString("en-NG")}`;
  }
}

export default async function TutorialPaymentReviewPage({
  searchParams,
}: PageProps) {
  const user = await getPlatformAdmin();

  if (!user) redirect("/school-access");

  const params = await searchParams;
  const admin = createAdminClient();

  const { data: requests, error } = await admin
    .from("live_tutorial_payment_requests")
    .select(
      "id, tutorial_id, school_id, amount, currency, payment_reference, proof_storage_path, status, created_at"
    )
    .eq("status", "submitted")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white sm:p-10">
        <h1 className="text-2xl font-bold">
          Unable to load payment requests
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Please refresh the page and try again.
        </p>
        <Link
          href="/platform-admin/live-learning"
          className="mt-6 inline-flex rounded-xl bg-teal-400 px-5 py-3 font-bold text-slate-950"
        >
          Back to Live Learning
        </Link>
      </main>
    );
  }

  const allRequests = requests || [];
  const schoolIds = [...new Set(allRequests.map((item) => item.school_id))];
  const tutorialIds = [...new Set(allRequests.map((item) => item.tutorial_id))];

  const [
    { data: schools },
    { data: tutorials },
  ] = await Promise.all([
    schoolIds.length
      ? admin
          .from("schools")
          .select("id, school_name, contact_email, contact_phone, city, state")
          .in("id", schoolIds)
      : Promise.resolve({ data: [] }),

    tutorialIds.length
      ? admin
          .from("live_tutorials")
          .select("id, title, subject, topic, scheduled_start")
          .in("id", tutorialIds)
      : Promise.resolve({ data: [] }),
  ]);

  const schoolById = new Map(
    (schools || []).map((school) => [school.id, school])
  );

  const tutorialById = new Map(
    (tutorials || []).map((tutorial) => [tutorial.id, tutorial])
  );

  const proofResults = await Promise.all(
    allRequests.map(async (request) => {
      if (!request.proof_storage_path) {
        return [request.id, null] as const;
      }

      const { data, error: signedUrlError } = await admin.storage
        .from("live-learning-payment-proofs")
        .createSignedUrl(request.proof_storage_path, 600);

      if (signedUrlError || !data?.signedUrl) {
        return [request.id, null] as const;
      }

      return [request.id, data.signedUrl] as const;
    })
  );

  const proofUrlById = new Map(proofResults);

  return (
    <main className="min-h-screen bg-[#071321] px-4 py-7 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="overflow-hidden rounded-3xl border border-teal-900/70 bg-gradient-to-br from-[#123a4b] via-[#10263d] to-[#111b31] shadow-2xl">
          <div className="flex flex-col gap-6 p-6 sm:p-9 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-400 text-xl font-black text-slate-950">
                  M
                </div>
                <div>
                  <p className="text-xs font-bold tracking-[0.25em] text-teal-300">
                    MICAN TECHNOLOGIES
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Private Super Admin Control Centre
                  </p>
                </div>
              </div>

              <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-teal-300">
                MICAN LIVE LEARNING
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Payment verification
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Review school bank transfer submissions, inspect uploaded
                proof and make the final access decision.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/platform-admin/live-learning"
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"
              >
                ← Live Learning
              </Link>
              <Link
                href="/platform-admin"
                className="rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-teal-300"
              >
                Super Admin dashboard
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 px-6 py-3 text-xs text-slate-400 sm:px-9">
            One Network. Many Schools. One Connected Future.
          </div>
        </header>

        {params.review === "approved" && (
          <div
            role="status"
            className="rounded-2xl border border-emerald-700 bg-emerald-950/50 p-5 text-emerald-200"
          >
            Payment approved. The school’s tutorial access has been activated.
          </div>
        )}

        {params.review === "rejected" && (
          <div
            role="status"
            className="rounded-2xl border border-amber-700 bg-amber-950/40 p-5 text-amber-200"
          >
            Payment submission rejected. The school can submit corrected proof.
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Awaiting verification
            </p>
            <p className="mt-3 text-4xl font-black text-white">
              {allRequests.length}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Submitted payment requests
            </p>
          </article>

          <article className="rounded-2xl border border-teal-900 bg-teal-950/30 p-6">
            <p className="text-sm text-teal-200">
              Verification authority
            </p>
            <p className="mt-3 text-lg font-bold text-white">
              Super Admin only
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Uploading proof does not automatically grant tutorial access.
            </p>
          </article>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">
              Review queue
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Submitted school payments
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Inspect each submission before approving or rejecting it.
            </p>
          </div>

          {allRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/70 p-10 text-center">
              <div className="text-5xl">✓</div>
              <h3 className="mt-4 text-xl font-bold">
                No payments awaiting review
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                New school payment submissions will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              {allRequests.map((request) => {
                const school = schoolById.get(request.school_id);
                const tutorial = tutorialById.get(request.tutorial_id);
                const proofUrl = proofUrlById.get(request.id);

                return (
                  <article
                    key={request.id}
                    className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-xl"
                  >
                    <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900 to-teal-950/40 p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-full border border-amber-700/60 bg-amber-950/50 px-3 py-1 text-xs font-bold text-amber-300">
                          AWAITING VERIFICATION
                        </span>
                        <span className="text-xs text-slate-500">
                          Submitted {formatDate(request.created_at)}
                        </span>
                      </div>

                      <h3 className="mt-4 text-xl font-black">
                        {school?.school_name || "School record unavailable"}
                      </h3>
                      <p className="mt-2 text-sm text-slate-400">
                        {tutorial?.title || "Tutorial record unavailable"}
                      </p>
                    </div>

                    <div className="space-y-5 p-5 sm:p-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                          <p className="text-xs text-slate-500">
                            Submitted amount
                          </p>
                          <p className="mt-2 text-xl font-black text-teal-300">
                            {formatMoney(
                              Number(request.amount),
                              request.currency
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                          <p className="text-xs text-slate-500">
                            Payment method
                          </p>
                          <p className="mt-2 font-bold">
                            Bank transfer
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">School contact</p>
                          <p className="mt-1 break-all font-medium">
                            {school?.contact_email || "Not available"}
                          </p>
                          <p className="mt-1 text-slate-400">
                            {school?.contact_phone || "No phone listed"}
                          </p>
                          <p className="mt-1 text-slate-500">
                            {[school?.city, school?.state].filter(Boolean).join(", ") || "Location unavailable"}
                          </p>
                        </div>

                        <div className="border-t border-slate-800 pt-3">
                          <p className="text-xs text-slate-500">
                            Tutorial details
                          </p>
                          <p className="mt-1 font-semibold">
                            {tutorial?.subject || "Subject unavailable"}
                            {tutorial?.topic ? ` · ${tutorial.topic}` : ""}
                          </p>
                          {tutorial?.scheduled_start && (
                            <p className="mt-1 text-slate-400">
                              Starts: {formatDate(tutorial.scheduled_start)}
                            </p>
                          )}
                        </div>

                        <div className="border-t border-slate-800 pt-3">
                          <p className="text-xs text-slate-500">
                            Bank transfer reference
                          </p>
                          <p className="mt-1 break-all rounded-lg bg-slate-950 p-3 font-mono text-sm text-teal-200">
                            {request.payment_reference || "Not provided"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                        <p className="text-sm font-bold">
                          Uploaded payment proof
                        </p>

                        {proofUrl ? (
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex rounded-xl border border-teal-700 bg-teal-950/50 px-4 py-3 text-sm font-bold text-teal-200 hover:bg-teal-900"
                          >
                            Open private proof file ↗
                          </a>
                        ) : (
                          <p className="mt-2 text-sm text-amber-300">
                            Proof file is unavailable. Do not approve without
                            independently verifying the payment.
                          </p>
                        )}

                        <p className="mt-3 text-xs leading-5 text-slate-500">
                          This temporary private link expires after 10 minutes.
                        </p>
                      </div>

                      <div className="border-t border-slate-800 pt-5">
                        <p className="mb-3 text-sm font-bold">
                          Make your verification decision
                        </p>

                        <form action={approveTutorialPayment}>
                          <input
                            type="hidden"
                            name="requestId"
                            value={request.id}
                          />
                          <button
                            type="submit"
                            disabled={!proofUrl}
                            className="w-full rounded-xl bg-emerald-500 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Confirm payment and activate access
                          </button>
                        </form>

                        <form
                          action={rejectTutorialPayment}
                          className="mt-4 space-y-3"
                        >
                          <input
                            type="hidden"
                            name="requestId"
                            value={request.id}
                          />

                          <label
                            htmlFor={`review-note-${request.id}`}
                            className="block text-sm font-semibold text-slate-300"
                          >
                            Rejection reason
                          </label>
                          <textarea
                            id={`review-note-${request.id}`}
                            name="reviewNote"
                            required
                            minLength={3}
                            maxLength={1000}
                            rows={3}
                            placeholder="Explain why this payment could not be verified..."
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white outline-none focus:border-amber-500"
                          />

                          <button
                            type="submit"
                            className="w-full rounded-xl border border-rose-700 bg-rose-950/40 px-5 py-3 text-sm font-bold text-rose-200 hover:bg-rose-900/60"
                          >
                            Reject payment submission
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="border-t border-slate-800 py-7 text-center">
          <p className="text-xs font-bold tracking-widest text-slate-400">
            MICAN TECHNOLOGIES
          </p>
          <p className="mt-2 text-xs text-slate-600">
            Private platform administration
          </p>
        </footer>
      </div>
    </main>
  );
}
