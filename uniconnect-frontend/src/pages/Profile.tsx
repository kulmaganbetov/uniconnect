import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import { apiGet, apiPut } from "../api/axios";
import { useAuthStore, User } from "../store/authStore";

export default function Profile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    country: "",
    university: "",
  });
  const [saved, setSaved] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiGet<User>("/api/profile"),
  });

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        name: profileQuery.data.name || "",
        country: profileQuery.data.country || "",
        university: profileQuery.data.university || "",
      });
    }
  }, [profileQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (body: typeof form) => apiPut<User>("/api/profile", body),
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData(["profile"], data);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const profile = profileQuery.data;

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />

      <main className="flex-1">
        <section className="bg-navy text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest mb-2">
              Account
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold">My profile</h1>
            <p className="text-gray-300 mt-2 max-w-2xl">
              Manage your personal details and university information.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {profileQuery.isLoading ? (
              <LoadingSpinner fullPage label="Loading profile..." />
            ) : profileQuery.isError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3">
                {(profileQuery.error as Error)?.message ||
                  "Failed to load profile"}
              </div>
            ) : profile ? (
              <>
                {saved && (
                  <div className="bg-green-50 border border-green-200 text-green-800 rounded px-4 py-3 text-sm mb-5">
                    Profile updated successfully.
                  </div>
                )}

                {/* Avatar & header */}
                <div className="card p-8 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-extrabold flex-shrink-0">
                      {profile.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-navy">
                        {profile.name || "Unnamed student"}
                      </h2>
                      <p className="text-sm text-muted">{profile.email}</p>
                      <span className="inline-block mt-2 badge-red capitalize">
                        {profile.role}
                      </span>
                    </div>
                    {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="btn-secondary"
                      >
                        Edit profile
                      </button>
                    )}
                  </div>
                </div>

                {/* Details / Form */}
                <div className="card p-8">
                  <h3 className="text-lg font-bold text-navy mb-6">
                    Personal details
                  </h3>

                  {editing ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-text-dark mb-2">
                          Full name
                        </label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-text-dark mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          required
                          value={form.country}
                          onChange={(e) =>
                            setForm({ ...form, country: e.target.value })
                          }
                          className="input-field"
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
                            setForm({ ...form, university: e.target.value })
                          }
                          className="input-field"
                        />
                      </div>

                      {updateMutation.isError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3">
                          {(updateMutation.error as Error)?.message ||
                            "Failed to update"}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(false);
                            setForm({
                              name: profile.name || "",
                              country: profile.country || "",
                              university: profile.university || "",
                            });
                          }}
                          className="btn-secondary flex-1"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updateMutation.isPending}
                          className="btn-primary flex-1 disabled:opacity-60"
                        >
                          {updateMutation.isPending
                            ? "Saving..."
                            : "Save changes"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <dl className="divide-y divide-gray-100">
                      <div className="flex py-4">
                        <dt className="w-1/3 text-sm font-semibold text-muted">
                          Full name
                        </dt>
                        <dd className="flex-1 text-text-dark">
                          {profile.name || "—"}
                        </dd>
                      </div>
                      <div className="flex py-4">
                        <dt className="w-1/3 text-sm font-semibold text-muted">
                          Email
                        </dt>
                        <dd className="flex-1 text-text-dark">
                          {profile.email}
                        </dd>
                      </div>
                      <div className="flex py-4">
                        <dt className="w-1/3 text-sm font-semibold text-muted">
                          Country
                        </dt>
                        <dd className="flex-1 text-text-dark">
                          {profile.country || "—"}
                        </dd>
                      </div>
                      <div className="flex py-4">
                        <dt className="w-1/3 text-sm font-semibold text-muted">
                          University
                        </dt>
                        <dd className="flex-1 text-text-dark">
                          {profile.university || "—"}
                        </dd>
                      </div>
                      <div className="flex py-4">
                        <dt className="w-1/3 text-sm font-semibold text-muted">
                          Role
                        </dt>
                        <dd className="flex-1 text-text-dark capitalize">
                          {profile.role}
                        </dd>
                      </div>
                    </dl>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
