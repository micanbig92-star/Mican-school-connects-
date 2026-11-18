
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSchoolManager } from "@/lib/supabase/school-manager";
import { requestLiveTutorialAccess } from "../actions";

type Props = {
  params: Promise<{ schoolId: string }>;
};

export default async function SchoolLiveLearningPage({ params }: Props) {
  const { schoolId } = await params;
  const { admin, school } = await requireSchoolManager(schoolId);

  const [
    { data: schoolSettings, error: schoolError },
    { data: tutorials, error: tutorialError },
    { data: paymentRequests, error: paymentError },
    { data: enrolments, error: enrolmentError },
  ] = await Promise.all([
    admin
      .from("schools")
      .select("live_learning_payment_exempt")
      .eq("id", schoolId)
      .maybeSingle(),

    admin
      .from("live_tutorials")
      .select(
        "id, title, subject, topic, description, scheduled_start, scheduled_end, payment_required, price_amount, price_currency, payment_method, bank_name, account_name, account_number, payment_instructions"
      )
      .eq("status", "published")
      .order("scheduled_start", { ascending: true }),

    admin
      .from("live_tutorial_payment_requests")
      .select("id, tutorial_id, status, amount, currency, payment_reference, review_note")
      .eq("school_id", schoolId),

    admin
      .from("live_tutorial_school_enrolments")
      .select("tutorial_id, status")
      .eq("school_id", schoolId),
  ]);

  if (
    schoolError ||
    tutorialError ||
    paymentError ||
    enrolmentError ||
    !schoolSettings
  ) {
    notFound();
  }

  const isExempt = schoolSettings.live_learning_payment_exempt === true;

  const requestByTutorial = new Map(
    (paymentRequests || []).map((request) => [
      request.tutorial_id,
      request,
    ])
  );

  const enrolmentByTutorial = new Map(
    (enrolments || []).map((enrolment) => [
      enrolment.tutorial_id,
      enrolment,
    ])
  );

  const money = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 2,
    }).format(amount);

  const dateTime = (value: string) =>
    new Date(value).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    });

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Awaiting payment",
      submitted: "Payment submitted",
      approved: "Payment approved",
      rejected: "Payment rejected",
      waived: "Payment waived",
      participating: "Access active",
      invited: "Invitation received",
      declined: "Invitation declined",
    };

    return labels[status] || status;
  };

  return (
    <main className="school-dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-brand">MICAN SCHOOLS CONNECT</p>
            <span className="dashboard-label">MICAN LIVE LEARNING</span>
          </div>

          <Link href="/school-dashboard" className="dashboard-signout">
            Back to dashboard
          </Link>
        </header>

        <section className="dashboard-welcome">
          <p className="dashboard-kicker">LIVE EDUCATION NETWORK</p>
          <h1>MICAN LIVE LEARNING</h1>
          <p>
            Discover live lessons, connect your school to expert teachers
            and give eligible students access to interactive learning.
          </p>
        </section>

        <section className="dashboard-section">
          <p className="dashboard-kicker">SCHOOL ACCOUNT</p>
          <h2>{school.school_name}</h2>

          {isExempt ? (
            <p className="live-notice live-success">
              Your school has a platform-approved Live Learning payment
              exemption. Eligible paid tutorials will not require payment.
            </p>
          ) : (
            <p className="live-notice">
              Browse available tutorials and review their payment
              requirements before requesting school access.
            </p>
          )}
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-kicker">AVAILABLE PROGRAMMES</p>
              <h2>Published live tutorials</h2>
            </div>
            <span className="dashboard-approved">
              {tutorials?.length || 0} available
            </span>
          </div>

          {!tutorials?.length ? (
            <div className="live-empty">
              <span>🎥</span>
              <h3>No published tutorials yet</h3>
              <p>
                New live learning programmes will appear here when
                the platform administrator publishes them.
              </p>
            </div>
          ) : (
            <div className="dashboard-modules live-tutorial-grid">
              {tutorials.map((tutorial) => {
                const payment = requestByTutorial.get(tutorial.id);
                const enrolment = enrolmentByTutorial.get(tutorial.id);

                const hasAccess = enrolment?.status === "participating";
                const paymentRequired = tutorial.payment_required === true;
                const requiresPayment = paymentRequired && !isExempt;

                const alreadyRequested =
                  payment &&
                  ["pending", "submitted", "approved", "waived"].includes(
                    payment.status
                  );

                return (
                  <article
                    className="dashboard-module live-tutorial-card"
                    key={tutorial.id}
                  >
                    <div className="live-card-top">
                      <span className="live-icon">🎓</span>
                      <span className="live-tag">
                        {tutorial.subject}
                      </span>
                    </div>

                    <h3>{tutorial.title}</h3>
                    <p className="live-topic">{tutorial.topic}</p>

                    {tutorial.description && (
                      <p>{tutorial.description}</p>
                    )}

                    <div className="live-information">
                      <div>
                        <span>Starts</span>
                        <strong>
                          {dateTime(tutorial.scheduled_start)}
                        </strong>
                      </div>

                      <div>
                        <span>Ends</span>
                        <strong>
                          {dateTime(tutorial.scheduled_end)}
                        </strong>
                      </div>
                    </div>

                    <div className="live-price">
                      <span>Programme fee</span>
                      <strong>
                        {requiresPayment
                          ? money(
                              Number(tutorial.price_amount),
                              tutorial.price_currency || "NGN"
                            )
                          : "FREE"}
                      </strong>
                    </div>

                    {requiresPayment && (
                      <div className="live-payment-details">
                        <h4>Bank transfer instructions</h4>

                        <div>
                          <span>Bank</span>
                          <strong>{tutorial.bank_name || "Not provided"}</strong>
                        </div>

                        <div>
                          <span>Account name</span>
                          <strong>{tutorial.account_name || "Not provided"}</strong>
                        </div>

                        <div>
                          <span>Account number</span>
                          <strong>{tutorial.account_number || "Not provided"}</strong>
                        </div>

                        {tutorial.payment_instructions && (
                          <p>{tutorial.payment_instructions}</p>
                        )}
                      </div>
                    )}

                    {hasAccess ? (
                      <div className="live-notice live-success">
                        Your school has access to this tutorial.
                      </div>
                    ) : payment?.status === "rejected" ? (
                      <div className="live-notice live-warning">
                        Your previous payment request was rejected.
                        {payment.review_note && (
                          <p>Review note: {payment.review_note}</p>
                        )}
                      </div>
                    ) : alreadyRequested ? (
                      <div className="live-notice">
                        {statusLabel(payment.status)}
                        {payment.review_note && (
                          <p>{payment.review_note}</p>
                        )}
                      </div>
                    ) : null}

                    {!hasAccess && !alreadyRequested && (
                      <form action={requestLiveTutorialAccess}>
                        <input
                          type="hidden"
                          name="schoolId"
                          value={schoolId}
                        />
                        <input
                          type="hidden"
                          name="tutorialId"
                          value={tutorial.id}
                        />

                        <button
                          className="signin-button live-request-button"
                          type="submit"
                        >
                          {requiresPayment
                            ? "Request payment access"
                            : "Request free access"}
                        </button>
                      </form>
                    )}

                    {hasAccess && (
                      <span className="dashboard-approved live-access-label">
                        Access active
                      </span>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="dashboard-footer">
          One Network. Many Schools. One Connected Future.
          <br />
          © MICAN Technologies
        </footer>
      </div>
    </main>
  );
}
