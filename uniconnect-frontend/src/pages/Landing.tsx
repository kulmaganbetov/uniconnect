import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const features = [
  {
    to: "/dormitory",
    title: "Dormitory",
    description:
      "Browse student residences, check availability, and submit applications online.",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    to: "/medical",
    title: "Medical",
    description:
      "Find clinics, pharmacies, and hospitals. Book appointments with one click.",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v8m4-4H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    to: "/jobs",
    title: "Jobs",
    description:
      "Discover part-time and temporary positions designed for students.",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    to: "/psychology",
    title: "Psychology",
    description:
      "Confidential support and counselling from licensed professionals.",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
  },
  {
    to: "/guides",
    title: "Digital Guides",
    description:
      "Master local transport, banking, mobile plans, and emergency services.",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    to: "/profile",
    title: "Profile",
    description:
      "Manage your personal data, applications, appointments, and history.",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

const testimonials = [
  {
    name: "Amira Hassan",
    country: "Egypt",
    university: "Al-Farabi KazNU",
    quote:
      "UniConnect helped me book my dormitory in two days. The medical appointment booking saved me hours at the clinic.",
  },
  {
    name: "Raj Patel",
    country: "India",
    university: "Nazarbayev University",
    quote:
      "The job listings are truly student-friendly. I found a part-time English tutoring position that fits my schedule perfectly.",
  },
  {
    name: "Chen Li",
    country: "China",
    university: "SDU",
    quote:
      "As a first-year student, the digital guides on banking and public transport made my first month in Almaty so much easier.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="hero-bg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <span className="inline-block bg-primary/20 text-primary-light border border-primary/40 rounded px-4 py-1 text-xs font-bold uppercase tracking-widest mb-6">
              For Foreign Students in Kazakhstan
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              Welcome to{" "}
              <span className="text-primary">UniConnect KZ</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed mb-10 max-w-2xl">
              A single platform for dormitories, medical services, temporary
              jobs, psychological support, and digital guides — everything an
              international student needs to thrive in Kazakhstan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register" className="btn-primary">
                Get started
              </Link>
              <a href="#services" className="btn-secondary bg-white/5">
                Explore services
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-extrabold text-primary mb-2">
                31,400+
              </div>
              <div className="text-sm uppercase tracking-wider text-muted font-semibold">
                Students supported
              </div>
            </div>
            <div className="text-center border-x border-gray-100">
              <div className="text-5xl font-extrabold text-primary mb-2">
                93
              </div>
              <div className="text-sm uppercase tracking-wider text-muted font-semibold">
                Countries represented
              </div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extrabold text-primary mb-2">
                5
              </div>
              <div className="text-sm uppercase tracking-wider text-muted font-semibold">
                Core services
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="services" className="bg-bg-light py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Everything you need in one place</h2>
            <p className="section-subtitle">
              From the moment you arrive to the day you graduate — UniConnect
              KZ gives you the tools, the guidance, and the people.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Link
                key={feature.to}
                to={feature.to}
                className="card p-7 group"
              >
                <div className="w-14 h-14 rounded bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-navy mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>
                <span className="text-primary font-semibold text-sm inline-flex items-center gap-1">
                  Learn more
                  <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">What our students say</h2>
            <p className="section-subtitle">
              Real stories from foreign students building their future in
              Kazakhstan.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-bg-light rounded-md p-7 border-l-4 border-primary"
              >
                <svg
                  className="w-8 h-8 text-primary mb-4 opacity-40"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
                </svg>
                <p className="text-text-dark leading-relaxed mb-5 text-sm">
                  "{t.quote}"
                </p>
                <div>
                  <div className="font-bold text-navy">{t.name}</div>
                  <div className="text-xs text-muted">
                    {t.country} · {t.university}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold mb-2">
              Ready to make Kazakhstan feel like home?
            </h3>
            <p className="text-white/90">
              Create your free UniConnect account today and unlock all
              services.
            </p>
          </div>
          <Link
            to="/register"
            className="bg-white text-primary font-bold px-8 py-3 rounded hover:bg-gray-100 transition-colors"
          >
            Create account
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
