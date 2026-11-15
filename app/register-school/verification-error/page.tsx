import Link from "next/link";

export default function VerificationErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl rounded-2xl border p-8 text-center shadow-sm">
        <div className="text-5xl mb-5">!</div>

        <h1 className="text-3xl font-bold mb-4">
          Verification Unsuccessful
        </h1>

        <p className="mb-4">
          We could not complete your school registration.
          Your application has not been confirmed.
        </p>

        <p className="mb-6">
          Please check that you used the correct verification
          email link. If the problem continues, try registering
          again or contact MICAN Technologies.
        </p>

        <Link
          href="/register-school"
          className="inline-block rounded-lg px-6 py-3 font-semibold"
        >
          Return to Registration
        </Link>
      </section>
    </main>
  );
}