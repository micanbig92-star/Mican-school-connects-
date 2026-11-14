
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import "./register-school.css";

export default function RegisterSchoolPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    const value = (name: string) =>
      String(form.get(name) || "").trim();

    const adminName = value("adminName");
    const adminEmail = value("adminEmail").toLowerCase();
    const password = value("password");
    const confirmPassword = value("confirmPassword");

    if (password.length < 10) {
      setError("Your password must contain at least 10 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    const schoolRegistration = {
      schoolName: value("schoolName"),
      schoolType: value("schoolType"),
      country: value("country"),
      state: value("state"),
      city: value("city"),
      address: value("address"),
      schoolEmail: value("schoolEmail").toLowerCase(),
      schoolPhone: value("schoolPhone"),
      website: value("website"),
      registrationNumber: value("registrationNumber"),
      adminName,
      adminEmail,
    };

    if (
      !schoolRegistration.schoolName ||
      !schoolRegistration.schoolType ||
      !schoolRegistration.country ||
      !schoolRegistration.state ||
      !schoolRegistration.city ||
      !schoolRegistration.address ||
      !schoolRegistration.schoolEmail ||
      !schoolRegistration.schoolPhone ||
      !adminName ||
      !adminEmail
    ) {
      setError("Please complete all required fields.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            school_registration: schoolRegistration,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setMessage(
        "Registration started. Check the administrator email inbox and follow the verification link. Your school will remain under review until approved."
      );

      event.currentTarget.reset();
    } catch {
      setError(
        "We could not start registration. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="registration-page">
      <header className="registration-top">
        <Link href="/" className="registration-brand">
          <span className="registration-mark">M</span>
          <span>
            <strong>MICAN</strong>
            <small>SCHOOLS CONNECT</small>
          </span>
        </Link>
        <Link href="/" className="registration-back">
          ← Back to homepage
        </Link>
      </header>

      <section className="registration-wrap">
        <div className="registration-intro">
          <span className="registration-kicker">JOIN THE NETWORK</span>
          <h1>
            Bring your school into a <em>connected future.</em>
          </h1>
          <p>
            Register your institution on MICAN SCHOOLS CONNECT.
            Verify the administrator email and wait for school review.
          </p>

          <div className="registration-steps">
            <div><b>01</b><span>School details</span></div>
            <div><b>02</b><span>Email verification</span></div>
            <div><b>03</b><span>School review</span></div>
            <div><b>04</b><span>Workspace access</span></div>
          </div>
        </div>

        <div className="registration-card">
          <div className="registration-card-heading">
            <span>NEW SCHOOL APPLICATION</span>
            <h2>School registration</h2>
            <p>Enter the institution's details and its first administrator.</p>
          </div>

          <form
            className="school-registration-form"
            onSubmit={handleSubmit}
          >
            <h3>School information</h3>

            <label>
              Official school name
              <input name="schoolName" type="text"
                maxLength={150} placeholder="Example Secondary School" required />
            </label>

            <div className="registration-fields">
              <label>
                School type
                <select name="schoolType" defaultValue="" required>
                  <option value="" disabled>Select type</option>
                  <option>Primary</option>
                  <option>Secondary</option>
                  <option>Combined</option>
                  <option>Technical / Vocational</option>
                  <option>College</option>
                  <option>University</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Country
                <input name="country" defaultValue="Nigeria"
                  maxLength={100} required />
              </label>
            </div>

            <div className="registration-fields">
              <label>
                State
                <input name="state" placeholder="State"
                  maxLength={100} required />
              </label>
              <label>
                City / town
                <input name="city" placeholder="City or town"
                  maxLength={100} required />
              </label>
            </div>

            <label>
              School address
              <input name="address" placeholder="Full school address"
                maxLength={250} required />
            </label>

            <div className="registration-fields">
              <label>
                School contact email
                <input name="schoolEmail" type="email"
                  placeholder="school@example.com" maxLength={254} required />
              </label>
              <label>
                School phone number
                <input name="schoolPhone" type="tel"
                  placeholder="+234..." maxLength={30} required />
              </label>
            </div>

            <label>
              School website <span className="optional-label">Optional</span>
              <input name="website" type="url"
                placeholder="https://www.example.com" maxLength={250} />
            </label>

            <label>
              Registration number <span className="optional-label">Optional</span>
              <input name="registrationNumber"
                placeholder="Official registration number" maxLength={100} />
            </label>

            <div className="registration-form-divider" />

            <h3>First school administrator</h3>
            <p className="registration-helper">
              This person will manage the school application.
              Their email must be verified before the application proceeds.
            </p>

            <label>
              Administrator full name
              <input name="adminName" placeholder="Full name"
                maxLength={150} autoComplete="name" required />
            </label>

            <label>
              Administrator email
              <input name="adminEmail" type="email"
                placeholder="admin@example.com"
                autoComplete="email" maxLength={254} required />
            </label>

            <label>
              Create password
              <input name="password" type="password"
                autoComplete="new-password"
                minLength={10} maxLength={72}
                placeholder="At least 10 characters" required />
            </label>

            <label>
              Confirm password
              <input name="confirmPassword" type="password"
                autoComplete="new-password"
                minLength={10} maxLength={72}
                placeholder="Enter the password again" required />
            </label>

            {error && (
              <p role="alert" className="registration-security-note">
                {error}
              </p>
            )}

            {message && (
              <p role="status" className="registration-security-note">
                {message}
              </p>
            )}

            <p className="registration-security-note">
              Email verification does not automatically approve a school.
              Workspace access remains locked until the application is reviewed.
            </p>

            <button
              className="registration-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Starting registration..." : "Register school"}
            </button>

            <p className="registration-footer-note">
              Already registered? <Link href="/">Return to homepage</Link>
            </p>
          </form>
        </div>
      </section>

      <footer className="registration-footer">
        © {new Date().getFullYear()} MICAN Technologies ·
        One Network. Many Schools. One Connected Future.
      </footer>
    </main>
  );
}
