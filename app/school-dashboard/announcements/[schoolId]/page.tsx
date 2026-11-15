
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSchoolManager } from "@/lib/supabase/school-manager";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "./actions";

type PageProps = {
  params: Promise<{ schoolId: string }>;
};

const audienceOptions = [
  { value: "everyone", label: "Everyone" },
  { value: "students", label: "Students" },
  { value: "teachers", label: "Teachers" },
  { value: "parents", label: "Parents" },
];

const priorityOptions = [
  { value: "normal", label: "Normal" },
  { value: "important", label: "Important" },
  { value: "urgent", label: "Urgent" },
];

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

export default async function AnnouncementsPage({
  params,
}: PageProps) {
  const { schoolId } = await params;

  const { admin, school } = await requireSchoolManager(schoolId);

  const { data: announcements, error } = await admin
    .from("school_announcements")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load school announcements.");
  }

  if (!school) notFound();

  const allAnnouncements = announcements || [];

  const publishedCount = allAnnouncements.filter(
    (item) => item.status === "published"
  ).length;

  const draftCount = allAnnouncements.filter(
    (item) => item.status === "draft"
  ).length;

  const archivedCount = allAnnouncements.filter(
    (item) => item.status === "archived"
  ).length;

  return (
    <main className="school-dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-brand">MICAN SCHOOLS CONNECT</p>
            <span className="dashboard-label">
              ANNOUNCEMENT MANAGEMENT
            </span>
          </div>

          <Link
            href="/school-dashboard"
            className="dashboard-back-link"
          >
            Back to Dashboard
          </Link>
        </header>

        <section className="dashboard-welcome">
          <p className="dashboard-kicker">COMMUNICATION CENTRE</p>
          <h1>Announcements</h1>
          <p>
            Create and manage important updates for {school.school_name}.
          </p>
        </section>

        <section className="dashboard-section">
          <p className="dashboard-kicker">ANNOUNCEMENT OVERVIEW</p>
          <h2>Activity summary</h2>

          <div className="dashboard-stats">
            <article className="dashboard-stat">
              <span className="stat-icon">📢</span>
              <p>Total announcements</p>
              <strong>{allAnnouncements.length}</strong>
            </article>

            <article className="dashboard-stat">
              <span className="stat-icon">✅</span>
              <p>Published</p>
              <strong>{publishedCount}</strong>
            </article>

            <article className="dashboard-stat">
              <span className="stat-icon">📝</span>
              <p>Drafts</p>
              <strong>{draftCount}</strong>
            </article>

            <article className="dashboard-stat">
              <span className="stat-icon">📁</span>
              <p>Archived</p>
              <strong>{archivedCount}</strong>
            </article>
          </div>
        </section>

        <section className="dashboard-section">
          <p className="dashboard-kicker">CREATE NEW</p>
          <h2>Write an announcement</h2>
          <p>
            Create a notice and choose who should receive it.
          </p>

          <form
            action={createAnnouncement}
            className="signin-card"
          >
            <input
              type="hidden"
              name="schoolId"
              value={schoolId}
            />

            <label className="dashboard-form-label">
              Announcement title
            </label>
            <input
              className="signin-input"
              type="text"
              name="title"
              placeholder="Enter announcement title"
              minLength={3}
              maxLength={160}
              required
            />

            <label className="dashboard-form-label">
              Announcement message
            </label>
            <textarea
              className="signin-input"
              name="body"
              placeholder="Write your announcement here..."
              rows={6}
              maxLength={5000}
              required
            />

            <label className="dashboard-form-label">
              Audience
            </label>
            <select
              className="signin-input"
              name="audience"
              defaultValue="everyone"
              required
            >
              {audienceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="dashboard-form-label">
              Priority
            </label>
            <select
              className="signin-input"
              name="priority"
              defaultValue="normal"
              required
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="dashboard-form-label">
              Publication status
            </label>
            <select
              className="signin-input"
              name="status"
              defaultValue="draft"
              required
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              className="signin-button"
              type="submit"
            >
              Create Announcement
            </button>
          </form>
        </section>

        <section className="dashboard-section">
          <p className="dashboard-kicker">SAVED RECORDS</p>
          <h2>Manage announcements</h2>

          {allAnnouncements.length === 0 ? (
            <div className="signin-card">
              <h3>No announcements yet</h3>
              <p>
                Your school's announcements will appear here after you
                create them.
              </p>
            </div>
          ) : (
            <div className="dashboard-announcement-list">
              {allAnnouncements.map((announcement) => (
                <article
                  className="dashboard-module"
                  key={announcement.id}
                >
                  <div className="dashboard-announcement-heading">
                    <div>
                      <h3>{announcement.title}</h3>
                      <p>
                        Created: {formatDate(announcement.created_at)}
                      </p>
                    </div>

                    <span className="dashboard-announcement-status">
                      {announcement.status}
                    </span>
                  </div>

                  <p className="dashboard-announcement-body">
                    {announcement.body}
                  </p>

                  <div className="dashboard-announcement-meta">
                    <span>
                      Audience: {announcement.audience}
                    </span>
                    <span>
                      Priority: {announcement.priority}
                    </span>
                  </div>

                  <details className="dashboard-announcement-edit">
                    <summary>Edit announcement</summary>

                    <form
                      action={updateAnnouncement}
                      className="signin-card"
                    >
                      <input
                        type="hidden"
                        name="schoolId"
                        value={schoolId}
                      />

                      <input
                        type="hidden"
                        name="announcementId"
                        value={announcement.id}
                      />

                      <label className="dashboard-form-label">
                        Title
                      </label>
                      <input
                        className="signin-input"
                        type="text"
                        name="title"
                        defaultValue={announcement.title}
                        minLength={3}
                        maxLength={160}
                        required
                      />

                      <label className="dashboard-form-label">
                        Message
                      </label>
                      <textarea
                        className="signin-input"
                        name="body"
                        defaultValue={announcement.body}
                        rows={5}
                        maxLength={5000}
                        required
                      />

                      <label className="dashboard-form-label">
                        Audience
                      </label>
                      <select
                        className="signin-input"
                        name="audience"
                        defaultValue={announcement.audience}
                        required
                      >
                        {audienceOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <label className="dashboard-form-label">
                        Priority
                      </label>
                      <select
                        className="signin-input"
                        name="priority"
                        defaultValue={announcement.priority}
                        required
                      >
                        {priorityOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <label className="dashboard-form-label">
                        Status
                      </label>
                      <select
                        className="signin-input"
                        name="status"
                        defaultValue={announcement.status}
                        required
                      >
                        {statusOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <button
                        className="signin-button"
                        type="submit"
                      >
                        Save Changes
                      </button>
                    </form>
                  </details>

                  <form action={deleteAnnouncement}>
                    <input
                      type="hidden"
                      name="schoolId"
                      value={schoolId}
                    />
                    <input
                      type="hidden"
                      name="announcementId"
                      value={announcement.id}
                    />

                    <button
                      className="dashboard-delete-button"
                      type="submit"
                    >
                      Delete Announcement
                    </button>
                  </form>
                </article>
              ))}
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
