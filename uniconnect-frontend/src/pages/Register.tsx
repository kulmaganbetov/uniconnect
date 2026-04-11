import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { apiPost } from "../api/axios";
import { useAuthStore, User } from "../store/authStore";

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  country: string;
  university: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

export default function Register() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState<RegisterPayload>({
    name: "",
    email: "",
    password: "",
    country: "",
    university: "",
  });

  const registerMutation = useMutation({
    mutationFn: (body: RegisterPayload) =>
      apiPost<User>("/api/auth/register", body),
    onSuccess: async () => {
      // Auto-login after successful registration
      try {
        const login_res = await apiPost<LoginResponse>("/api/auth/login", {
          email: form.email,
          password: form.password,
        });
        login(login_res.token, login_res.user);
        navigate("/dashboard", { replace: true });
      } catch {
        navigate("/login", { replace: true });
      }
    },
  });

  const handleChange = (field: keyof RegisterPayload, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(form);
  };

  return (
    <div className="min-h-screen auth-bg flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
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
                Create your account
              </h1>
              <p className="text-muted text-sm mb-8">
                Join UniConnect KZ — the support platform for foreign
                students.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="input-field"
                    placeholder="Amira Hassan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
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
                    minLength={6}
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="input-field"
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-text-dark mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      required
                      value={form.country}
                      onChange={(e) =>
                        handleChange("country", e.target.value)
                      }
                      className="input-field"
                      placeholder="Egypt"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-dark mb-2">
                      University
                    </label>
                    <input
                      type="text"
                      required
                      value={form.university}
                      onChange={(e) =>
                        handleChange("university", e.target.value)
                      }
                      className="input-field"
                      placeholder="Al-Farabi KazNU"
                    />
                  </div>
                </div>

                {registerMutation.isError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3">
                    {(registerMutation.error as Error)?.message ||
                      "Registration failed"}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {registerMutation.isPending
                    ? "Creating account..."
                    : "Create account"}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-muted">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary font-semibold hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </div>
            <div className="bg-bg-light px-8 py-4 text-center text-xs text-muted">
              By creating an account you accept the UniConnect KZ terms of
              service.
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
