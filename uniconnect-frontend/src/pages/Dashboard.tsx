import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuthStore } from "../store/authStore";

const quickLinks = [
  {
    to: "/dormitory",
    title: "Dormitory",
    description: "Apply for a student residence",
    icon: "🏠",
  },
  {
    to: "/medical",
    title: "Medical",
    description: "Book a clinic appointment",
    icon: "🩺",
  },
  {
    to: "/jobs",
    title: "Jobs",
    description: "Find part-time work",
    icon: "💼",
  },
  {
    to: "/psychology",
    title: "Psychology",
    description: "Request confidential support",
    icon: "💬",
  },
  {
    to: "/guides",
    title: "Guides",
    description: "Transport, banking, mobile",
    icon: "📘",
  },
  {
    to: "/profile",
    title: "Profile",
    description: "Manage your details",
    icon: "👤",
  },
];

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />

      <main className="flex-1">
        {/* Welcome banner */}
        <section className="bg-navy text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest mb-2">
                  Personal dashboard
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white">
                  Welcome back, {user?.name?.split(" ")[0] || "student"}
                </h1>
                <p className="text-gray-300 mt-2 max-w-xl">
                  Here's your student workspace. Quickly access services,
                  track applications, and manage your profile.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded p-4 min-w-[220px]">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                  Student
                </div>
                <div className="font-bold text-white">
                  {user?.name || "—"}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {user?.university || "University not set"}
                </div>
                <div className="text-xs text-gray-400">
                  {user?.country || "Country not set"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick access */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-navy mb-2">
              Quick access
            </h2>
            <p className="text-muted mb-8">
              Jump to the services you need most.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {quickLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="card p-6 flex items-start gap-4 group"
                >
                  <div className="text-3xl">{link.icon}</div>
                  <div className="flex-1">
                    <div className="font-bold text-navy text-lg mb-1">
                      {link.title}
                    </div>
                    <div className="text-sm text-muted">
                      {link.description}
                    </div>
                  </div>
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Recent activity / tips */}
        <section className="pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-7">
                <h3 className="text-lg font-bold text-navy mb-4">
                  Getting started checklist
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">1.</span>
                    <span>
                      Complete your profile with your country and university
                      details.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">2.</span>
                    <span>
                      Browse the dormitory list and submit your application.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">3.</span>
                    <span>
                      Read the digital guides to learn about local transport
                      and banking.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">4.</span>
                    <span>
                      Book a medical check-up at a registered student clinic.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="card p-7">
                <h3 className="text-lg font-bold text-navy mb-4">
                  Need help?
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-5">
                  Our psychology and student-support services are free and
                  confidential. You can submit a request at any time and a
                  counsellor will reach out within 48 hours.
                </p>
                <Link to="/psychology" className="btn-primary">
                  Request support
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
