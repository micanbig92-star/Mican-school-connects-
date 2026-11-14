
const features = [
  {
    number: "01",
    title: "School Network",
    description:
      "Connect schools, build partnerships and discover educational communities.",
  },
  {
    number: "02",
    title: "Global Arena",
    description:
      "Bring schools together through supervised academic competitions.",
  },
  {
    number: "03",
    title: "Student Portfolio",
    description:
      "Showcase student projects, skills and achievements.",
  },
  {
    number: "04",
    title: "Teacher Connect",
    description:
      "Create opportunities for teachers to collaborate and share knowledge.",
  },
  {
    number: "05",
    title: "Learning Resources",
    description:
      "Discover approved educational notes and learning materials.",
  },
  {
    number: "06",
    title: "School Community",
    description:
      "Build a connected educational community across institutions.",
  },
];

export default function Home() {
  return (
    <>
      <header className="site-header">
        <nav className="container navbar">
          <a href="/" className="brand">
            MICAN <span>SCHOOLS CONNECT</span>
          </a>

          <div className="nav-links">
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#contact">Contact</a>
          </div>

          <a href="#contact" className="btn btn-primary">
            Get Started
          </a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-content">
            <span className="hero-tag">
              A New Future for School Connectivity
            </span>

            <h1>
              One Network.
              <br />
              Many Schools.
              <br />
              <span>One Connected Future.</span>
            </h1>

            <p>
              Connecting schools, empowering teachers and showcasing
              student potential through one global education platform.
            </p>

            <div className="hero-actions">
              <a href="#features" className="btn btn-primary">
                Explore Platform
              </a>

              <a href="#about" className="btn btn-secondary">
                Discover Our Vision
              </a>
            </div>
          </div>
        </section>

        <section className="section" id="about">
          <div className="container section-heading">
            <h2>Education Without Boundaries</h2>
            <p>
              MICAN SCHOOLS CONNECT is designed to bring educational
              communities closer, beginning in Nigeria and expanding
              towards a global network.
            </p>
          </div>
        </section>

        <section className="section" id="features">
          <div className="container">
            <div className="section-heading">
              <h2>Explore Our Platform</h2>
              <p>
                Powerful opportunities for schools, teachers and students.
              </p>
            </div>

            <div className="feature-grid">
              {features.map((feature) => (
                <article className="feature-card" key={feature.number}>
                  <span className="hero-tag">{feature.number}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="contact">
          <div className="container section-heading">
            <h2>Be Part of the Future</h2>
            <p>
              A connected future for schools starts with a strong
              foundation. Join us as we build it.
            </p>
            <a href="mailto:info@mican.com" className="btn btn-primary">
              Contact MICAN Technologies
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <h3>MICAN SCHOOLS CONNECT</h3>
          <p>One Network. Many Schools. One Connected Future.</p>
          <p>© {new Date().getFullYear()} MICAN Technologies.</p>
        </div>
      </footer>
    </>
  );
}
