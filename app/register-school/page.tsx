"use client";

import Link from "next/link";
import "./register-school.css";

export default function RegisterSchoolPage() {
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
            After email verification, each school registration
            will be reviewed before its workspace is approved.
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

          <form className="school-registration-form">
            <h3>School information</h3>

            <label>
              Official school name
              <input name="schoolName" type="text"
                placeholder="Example Secondary School" required />
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
                <input name="country" defaultValue="Nigeria" required />
              </label>
            </div>

            <div className="registration-fields">
              <label>
                State
                <input name="state" placeholder="State" required />
              </label>

              <label>
                City / town
                <input name="city" placeholder="City or town" required />
              </label>
            </div>

            <label>
              School address
              <input name="address" placeholder="Full school address" required />
            </label>

            <div className="registration-fields">
              <label>
                School contact email
                <input name="schoolEmail" type="email"
                  placeholder="school@example.com" required />
              </label>

              <label>
                School phone number
                <input name="schoolPhone" type="tel"
                  placeholder="+234..." required />
              </label>
            </div>

            <label>
              School website <span className="optional-label">Optional</span>
              <input name="website" type="url"
                placeholder="https://www.example.com" />
            </label>

            <label>
              Registration number <span className="optional-label">Optional</span>
              <input name="registrationNumber"
                placeholder="Official registration number" />
            </label>

            <div className="registration-form-divider" />

            <h3>First school administrator</h3>

            <p className="registration-helper">
              This person will manage the school application.
              Their email must be verified before the application proceeds.
            </p>

            <label>
              Administrator full name
              <input name="adminName" placeholder="Full name" required />
            </label>

            <label>
              Administrator email
              <input name="adminEmail" type="email"
                placeholder="admin@example.com" required />
            </label>

            <p className="registration-security-note">
              Your account will not receive school access until the
              email is verified and the school is approved.
            </p>

            <button className="registration-submit" type="button" disabled>
              Secure registration is being connected
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