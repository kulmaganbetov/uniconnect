import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { canAccessAdmin, ROLE_LABELS } from "../lib/roles";

interface NavLinkItem {
  to: string;
  label: string;
  auth: boolean;
  staffOnly?: boolean;
}

const navLinks: NavLinkItem[] = [
  { to: "/dashboard", label: "Dashboard", auth: true },
  { to: "/dormitory", label: "Dormitory", auth: true },
  { to: "/medical", label: "Medical", auth: true },
  { to: "/jobs", label: "Jobs", auth: true },
  { to: "/psychology", label: "Psychology", auth: true },
  { to: "/guides", label: "Guides", auth: false },
  { to: "/ai", label: "AI Consultant", auth: true },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const visibleLinks = navLinks.filter((l) => !l.auth || isAuthenticated);
  const showAdmin = isAuthenticated && canAccessAdmin(user?.role);
  const roleLabel = user?.role ? ROLE_LABELS[user.role] || user.role : "";

  return (
    <header className="sticky top-0 z-50 bg-navy text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 flex-shrink-0"
            onClick={() => setMenuOpen(false)}
          >
            <div className="w-9 h-9 rounded bg-primary flex items-center justify-center font-extrabold text-white text-lg">
              U
            </div>
            <div className="leading-tight">
              <div className="font-extrabold text-lg tracking-tight">
                UniConnect
              </div>
              <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                Kazakhstan
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded transition-colors ${
                    isActive
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-200 hover:text-primary"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {showAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-semibold rounded transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-primary border border-primary/40 hover:bg-primary hover:text-white"
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>

          {/* Desktop auth */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm text-gray-200 hover:text-primary transition-colors"
                >
                  <span>{user?.name || "Profile"}</span>
                  {roleLabel && (
                    <span className="text-[10px] uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded font-semibold">
                      {roleLabel}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-200 hover:text-primary transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 text-gray-200 hover:text-primary transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-white/10 py-4 space-y-1 animate-fade-in">
            {visibleLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-primary bg-white/5"
                      : "text-gray-200 hover:text-primary hover:bg-white/5"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {showAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "text-white bg-primary"
                      : "text-primary hover:bg-white/5"
                  }`
                }
              >
                Admin Panel
              </NavLink>
            )}
            <div className="border-t border-white/10 pt-3 mt-3 px-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 text-sm text-gray-200 hover:text-primary transition-colors"
                  >
                    <span>{user?.name || "Profile"}</span>
                    {roleLabel && (
                      <span className="text-[10px] uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded font-semibold">
                        {roleLabel}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="w-full text-center text-sm font-semibold bg-primary text-white py-2 rounded"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block text-sm text-gray-200 hover:text-primary transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-center text-sm font-semibold bg-primary text-white py-2 rounded"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
