

const features = [
  {
    number: "01",
    label: "CONNECT",
    title: "School Network",
    description:
      "Connect schools, build partnerships and discover educational communities.",
  },
  {
    number: "02",
    label: "COMPETE",
    title: "Global Arena",
    description:
      "Bring schools together through supervised academic competitions.",
  },
  {
    number: "03",
    label: "SHOWCASE",
    title: "Student Portfolio",
    description:
      "Showcase student projects, skills and achievements.",
  },
  {
    number: "04",
    label: "COLLABORATE",
    title: "Teacher Connect",
    description:
      "Create opportunities for teachers to collaborate and share knowledge.",
  },
  {
    number: "05",
    label: "DISCOVER",
    title: "Learning Resources",
    description:
      "Discover approved educational notes and learning materials.",
  },
  {
    number: "06",
    label: "BELONG",
    title: "School Community",
    description:
      "Build a connected educational community across institutions.",
  },
];

export default function Home() {
  return (
    <>
      <div className="announcement">
        <div className="container announcement-inner">
          <span className="announcement-dot" />
          NIGERIA FIRST. GLOBAL BY DESIGN.
        </div>
      </div>

      <header className="site-header">
        <nav className="container navbar">
          <a href="#home" className="brand">
            <span className="brand-mark">M</span>
            <span className="brand-copy">
              <strong>MICAN</strong>
              <small>SCHOOLS CONNECT</small>
            </span>
          </a>

          <div className="nav-links">
            <a href="#about">About</a>
            <a href="#features">Platform</a>
            <a href="#vision">Our Vision</a>
          </div>

          <a href="#features" className="btn btn-nav">
            Explore Platform →
          </a>
        </nav>
      </header>

      <main id="home">
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">
                A CONNECTED FUTURE FOR EDUCATION
              </span>

              <h1>
                One Network.
                <br />
                Many Schools.
                <br />
                <span>One Shared Future.</span>
              </h1>

              <p className="hero-description">
                A digital home for school communities to connect,
                collaborate and create new opportunities for education.
                Starting in Nigeria and reaching beyond.
              </p>

              <div className="hero-actions">
                <a href="#features" className="btn btn-primary">
                  Discover the Platform →
                </a>
                <a href="#about" className="text-link">
                  Get to Know Us ↗
                </a>
              </div>

              <div className="hero-note">
                CREATED BY MICAN TECHNOLOGIES
              </div>
            </div>

            <div className="network-visual">
              <div className="visual-topline">
                <span>THE SCHOOL NETWORK</span>
                <span>MICAN GLOBAL VISION</span>
              </div>

              <div className="network-stage">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />

                <div className="network-line line-one" />
                <div className="network-line line-two" />
                <div className="network-line line-three" />

                <div className="network-node node-school">
                  <span>S</span> Schools
                </div>

                <div className="network-node node-teacher">
                  <span>T</span> Teachers
                </div>

                <div className="network-node node-student">
                  <span>P</span> Students
                </div>

                <div className="network-core">
                  <div className="core-mark">M</div>
                  <strong>MICAN</strong>
                  <small>SCHOOLS CONNECT</small>
                </div>

                <span className="stage-caption">
                  One Community. More Possibilities.
                </span>
              </div>

              <div className="visual-bottomline">
                CONNECTING EDUCATION
              </div>
            </div>
          </div>
        </section>

        <section className="audience-strip">
          <div className="container audience-inner">
            <span>CREATED FOR EDUCATION COMMUNITIES</span>
            <div>
              <b>Schools</b>
              <i />
              <b>Teachers</b>
              <i />
              <b>Students</b>
            </div>
          </div>
        </section>

        <section className="section" id="about">
          <div className="container about-grid">
            <div>
              <span className="section-kicker">01 / ABOUT US</span>
              <h2>
                Education is stronger when we move
                <span> together.</span>
              </h2>
            </div>

            <div className="about-copy">
              <p>
                MICAN SCHOOLS CONNECT is being built to bring
                school communities into one organised digital
                network.
              </p>
              <p>
                We believe meaningful connections can open doors
                to collaboration, creativity and new learning
                opportunities.
              </p>
              <p>
                Our journey begins in Nigeria, with a long-term
                ambition to connect educational communities
                across the world.
              </p>
            </div>
          </div>

          <div className="container principles-grid">
            <article className="principle">
              <span>01</span>
              <div>
                <h3>Built Around Schools</h3>
                <p>Designed to support the needs of school communities.</p>
              </div>
            </article>

            <article className="principle">
              <span>02</span>
              <div>
                <h3>Connected by Design</h3>
                <p>Bringing students, teachers and institutions closer.</p>
              </div>
            </article>

            <article className="principle">
              <span>03</span>
              <div>
                <h3>Ready to Grow</h3>
                <p>Starting in Nigeria, with a vision for global reach.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="section features-section" id="features">
          <div className="container">
            <div className="features-heading">
              <div>
                <span className="section-kicker">02 / THE PLATFORM</span>
                <h2>
                  One Platform.
                  <br />
                  <span>Many Possibilities.</span>
                </h2>
              </div>

              <p>
                A growing collection of experiences designed
                to help educational communities do more together.
              </p>
            </div>

            <div className="feature-grid">
              {features.map((feature) => (
                <article className="feature-card" key={feature.number}>
                  <div className="feature-card-top">
                    <span className="feature-number">
                      {feature.number}
                    </span>
                    <span className="feature-label">
                      {feature.label}
                    </span>
                  </div>

                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                    <span className="feature-arrow">↗</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="vision-section" id="vision">
          <div className="container vision-panel">
            <div className="vision-content">
              <span className="section-kicker">
                03 / OUR VISION
              </span>

              <h2>
                Let’s build a more connected future for education.
              </h2>

              <p>
                A network where schools can meet, ideas can travel
                and potential can be shared.
              </p>

              <a href="#home" className="btn btn-light">
                Back to the Beginning ↑
              </a>
            </div>

            <div className="vision-emblem">
              M
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-main">
          <a href="#home" className="brand footer-brand">
            <span className="brand-mark">M</span>
            <span className="brand-copy">
              <strong>MICAN</strong>
              <small>SCHOOLS CONNECT</small>
            </span>
          </a>

          <p>
            One Network. Many Schools. One Connected Future.
          </p>

          <a href="#home" className="footer-top">
            Back to Top ↑
          </a>
        </div>

        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} MICAN Technologies.
          </span>
          <span>Built for a world of connected learning.</span>
        </div>
      </footer>
    </>
  );
}
