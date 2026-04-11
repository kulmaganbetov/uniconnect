import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { apiPost } from "../api/axios";
import { useAuthStore, User } from "../store/authStore";

interface LoginResponse {
  token: string;
  user: User;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname || "/dashboard";

  const mutation = useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      apiPost<LoginResponse>("/api/auth/login", body),
    onSuccess: (data) => {
      login(data.token, data.user);
      navigate(from, { replace: true });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen auth-bg flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 rounded bg-primary flex items-center justify-center font-extrabold text-white text-2xl">
              U
            </div>
            <div className="leading-tight text-white">
              <div className="font-extrabold text-xl">UniConnect</div>
              <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                Kazakhstan
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-md shadow-2xl border-t-4 border-primary overflow-hidden">
            <div className="p-8 md:p-10">
              <h1 className="text-2xl md:text-3xl font-bold text-navy mb-2">
                Welcome back
              </h1>
              <p className="text-muted text-sm mb-8">
                Log in to access your student dashboard.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="student@example.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>

                {mutation.isError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3">
                    {(mutation.error as Error)?.message || "Login failed"}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {mutation.isPending ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-muted">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-primary font-semibold hover:underline"
                >
                  Create one
                </Link>
              </div>
            </div>
            <div className="bg-bg-light px-8 py-4 text-center text-xs text-muted">
              By continuing you accept the UniConnect KZ terms of service.
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              to="/"
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
