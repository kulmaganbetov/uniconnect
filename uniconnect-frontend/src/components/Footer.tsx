import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-navy text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded bg-primary flex items-center justify-center font-extrabold text-white text-lg">
                U
              </div>
              <div className="leading-tight">
                <div className="font-extrabold text-lg text-white">
                  UniConnect
                </div>
                <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                  Kazakhstan
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              A unified support platform for Narxoz University students.
              Find housing, healthcare, jobs, and guidance in one place.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Services
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/dormitory"
                  className="hover:text-primary transition-colors"
                >
                  Dormitory
                </Link>
              </li>
              <li>
                <Link
                  to="/medical"
                  className="hover:text-primary transition-colors"
                >
                  Medical services
                </Link>
              </li>
              <li>
                <Link
                  to="/jobs"
                  className="hover:text-primary transition-colors"
                >
                  Temporary jobs
                </Link>
              </li>
              <li>
                <Link
                  to="/psychology"
                  className="hover:text-primary transition-colors"
                >
                  Psychological support
                </Link>
              </li>
              <li>
                <Link
                  to="/guides"
                  className="hover:text-primary transition-colors"
                >
                  Digital guides
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Account
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/login"
                  className="hover:text-primary transition-colors"
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="hover:text-primary transition-colors"
                >
                  Create account
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  className="hover:text-primary transition-colors"
                >
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Contact
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>55 Zhandosov St</li>
              <li>Almaty, Kazakhstan</li>
              <li>
                <a
                  href="mailto:support@uniconnect.kz"
                  className="hover:text-primary transition-colors"
                >
                  support@uniconnect.kz
                </a>
              </li>
              <li>
                <a
                  href="tel:+77273773333"
                  className="hover:text-primary transition-colors"
                >
                  +7 727 377 3333
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} UniConnect KZ. All rights
            reserved.
          </p>
          <p>Built for Narxoz University students.</p>
        </div>
      </div>
    </footer>
  );
}
