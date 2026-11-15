import Link from "next/link";

export default function RegistrationCompletePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl rounded-2xl border p-8 text-center shadow-sm">
        <div className="text-5xl mb-5">✓</div>

        <h1 className="text-3xl font-bold mb-4">
          Application Submitted!
        </h1>

        <p className="text-lg mb-4">
          Your school email has been verified successfully.
        </p>

        <p className="mb-4">
          Your school registration is now awaiting review by
          MICAN Technologies.
        </p>

        <div className="rounded-xl border p-4 mb-6">
          <h2 className="font-semibold mb-2">
            What happens next?
          </h2>

          <p>
            Our team will review your school application.
            Your school workspace will become available after
            approval.
          </p>

          <p className="font-semibold mt-3">
            Current status: Pending Review
          </p>
        </div>

        <Link
          href="/"
          className="inline-block rounded-lg px-6 py-3 font-semibold"
        >
          Return to Homepage
        </Link>
      </section>
    </main>
  );
}