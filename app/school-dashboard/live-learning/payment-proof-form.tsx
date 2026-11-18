
"use client";

import { useState } from "react";

type Props = {
  schoolId: string;
  tutorialId: string;
};

export default function PaymentProofForm({
  schoolId,
  tutorialId,
}: Props) {
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!reference.trim() || !file) {
      setMessage("Enter your bank transfer reference and select your proof file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Your proof file must not exceed 5 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("schoolId", schoolId);
    formData.append("tutorialId", tutorialId);
    formData.append("paymentReference", reference.trim());
    formData.append("proof", file);

    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/live-learning/school/submit-payment",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Payment proof submission failed.");
      }

      setSuccess(true);
      setMessage(result.message);
      setReference("");
      setFile(null);

      const input = document.getElementById(
        `payment-proof-${tutorialId}`
      ) as HTMLInputElement | null;

      if (input) input.value = "";

      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="live-payment-details" onSubmit={handleSubmit}>
      <h4>Submit bank transfer proof</h4>

      <label htmlFor={`payment-reference-${tutorialId}`}>
        Bank transfer reference
      </label>
      <input
        id={`payment-reference-${tutorialId}`}
        type="text"
        value={reference}
        onChange={(event) => setReference(event.target.value)}
        maxLength={120}
        minLength={3}
        required
        placeholder="Enter your transaction reference"
      />

      <label htmlFor={`payment-proof-${tutorialId}`}>
        Upload payment receipt or screenshot
      </label>
      <input
        id={`payment-proof-${tutorialId}`}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={(event) =>
          setFile(event.target.files?.[0] || null)
        }
        required
      />

      <p className="live-topic">
        Accepted files: JPEG, PNG, WebP or PDF. Maximum size: 5 MB.
      </p>

      <button
        className="signin-button live-request-button"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Submitting proof..." : "Submit payment proof"}
      </button>

      {message && (
        <p
          className={success ? "live-notice live-success" : "live-notice live-warning"}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
