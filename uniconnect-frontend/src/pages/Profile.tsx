import { FormEvent, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import { apiGet, apiPostFormData, apiPut } from "../api/axios";
import { useAuthStore, User } from "../store/authStore";

export default function Profile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    country: "",
    university: "",
    avatar_url: "",
    language: "",
    language_level: "",
  });
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");

  // Password change state
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [pwdError, setPwdError] = useState("");
  const [pwdSaved, setPwdSaved] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiGet<User>("/api/profile"),
  });

  const profile = profileQuery.data;

  // Sync form when profile loads
  const initForm = (p: User) =>
    setForm({
      name: p.name || "",
      country: p.country || "",
      university: p.university || "",
      avatar_url: p.avatar_url || "",
      language: p.language || "",
      language_level: p.language_level || "",
    });

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

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("avatar", file);
      return apiPostFormData<{ avatar_url: string }>("/api/profile/avatar", fd);
    },
    onSuccess: ({ avatar_url }) => {
      setUploadError("");
      setForm((f) => ({ ...f, avatar_url }));
      queryClient.setQueryData(["profile"], (old: User | undefined) =>
        old ? { ...old, avatar_url } : old
      );
      const cur = useAuthStore.getState().user;
      if (cur) setUser({ ...cur, avatar_url });
    },
    onError: (e: Error) => setUploadError(e.message || "Upload failed"),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const changePwdMutation = useMutation({
    mutationFn: (body: { current_password: string; new_password: string }) =>
      apiPut<{ status: string }>("/api/profile/password", body),
    onSuccess: () => {
      setChangingPwd(false);
      setPwdForm({ current_password: "", new_password: "", confirm_password: "" });
      setPwdError("");
      setPwdSaved(true);
      setTimeout(() => setPwdSaved(false), 3000);
    },
    onError: (e: Error) => setPwdError(e.message || "Failed to change password"),
  });

  const handlePwdSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPwdError("");
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      setPwdError("New passwords do not match");
      return;
    }
    if (pwdForm.new_password.length < 6) {
      setPwdError("New password must be at least 6 characters");
      return;
    }
    changePwdMutation.mutate({
      current_password: pwdForm.current_password,
      new_password: pwdForm.new_password,
    });
  };

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
                {(profileQuery.error as Error)?.message || "Failed to load profile"}
              </div>
            ) : profile ? (
              <>
                {saved && (
                  <div className="bg-green-50 border border-green-200 text-green-800 rounded px-4 py-3 text-sm mb-5">
                    Profile updated successfully.
                  </div>
                )}
                {pwdSaved && (
                  <div className="bg-green-50 border border-green-200 text-green-800 rounded px-4 py-3 text-sm mb-5">
                    Password changed successfully.
                  </div>
                )}

                {/* Avatar & header */}
                <div className="card p-8 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="flex-shrink-0">
                      {/* Clickable avatar — always opens file picker */}
                      <button
                        type="button"
                        onClick={() => {
                          setUploadError("");
                          fileInputRef.current?.click();
                        }}
                        disabled={uploadAvatarMutation.isPending}
                        className="relative group w-20 h-20 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        title="Click to upload a new photo"
                      >
                        {uploadAvatarMutation.isPending ? (
                          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                            <svg className="animate-spin w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                          </div>
                        ) : profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-extrabold">
                            {profile.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                        )}
                        {/* hover overlay */}
                        {!uploadAvatarMutation.isPending && (
                          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadAvatarMutation.mutate(file);
                          e.target.value = "";
                        }}
                      />
                      {uploadError && (
                        <p className="text-xs text-red-600 mt-1 max-w-[80px] text-center">{uploadError}</p>
                      )}
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
                        onClick={() => {
                          initForm(profile);
                          setEditing(true);
                        }}
                        className="btn-secondary"
                      >
                        Edit profile
                      </button>
                    )}
                  </div>
                </div>

                {/* Details / Form */}
                <div className="card p-8 mb-6">
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
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                          onChange={(e) => setForm({ ...form, country: e.target.value })}
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
                          onChange={(e) => setForm({ ...form, university: e.target.value })}
                          className="input-field"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-text-dark mb-2">
                            Language{" "}
                            <span className="text-muted font-normal">(optional)</span>
                          </label>
                          <select
                            value={form.language}
                            onChange={(e) => setForm({ ...form, language: e.target.value })}
                            className="input-field"
                          >
                            <option value="">— Not set —</option>
                            <option value="English">English</option>
                            <option value="German">German</option>
                            <option value="French">French</option>
                            <option value="Spanish">Spanish</option>
                            <option value="Chinese">Chinese</option>
                            <option value="Japanese">Japanese</option>
                            <option value="Korean">Korean</option>
                            <option value="Kazakh">Kazakh</option>
                            <option value="Russian">Russian</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-text-dark mb-2">
                            Language Level{" "}
                            <span className="text-muted font-normal">(optional)</span>
                          </label>
                          <select
                            value={form.language_level}
                            onChange={(e) => setForm({ ...form, language_level: e.target.value })}
                            className="input-field"
                          >
                            <option value="">— Not set —</option>
                            <option value="A1">A1</option>
                            <option value="A2">A2</option>
                            <option value="B1">B1</option>
                            <option value="B2">B2</option>
                            <option value="C1">C1</option>
                            <option value="C2">C2</option>
                            <option value="Native">Native</option>
                          </select>
                        </div>
                      </div>

                      {updateMutation.isError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3">
                          {(updateMutation.error as Error)?.message || "Failed to update"}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditing(false)}
                          className="btn-secondary flex-1"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updateMutation.isPending}
                          className="btn-primary flex-1 disabled:opacity-60"
                        >
                          {updateMutation.isPending ? "Saving..." : "Save changes"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <dl className="divide-y divide-gray-100">
                      <div className="flex py-4">
                        <dt className="w-1/3 text-sm font-semibold text-muted">Full name</dt>
                        <dd className="flex-1 text-text-dark">{profile.name || "—"}</dd>
                      </div>
                      <div className="flex py-4">
                        <dt className="w-1/3 text-sm font-semibold text-muted">Email</dt>
                        <dd className="flex-1 text-text-dark">{profile.email}</dd>
                      </div>
                      <div className="flex py-4">
                        <dt className="w-1/3 text-sm font-semibold text-muted">Country</dt>
                        <dd className="flex-1 text-text-dark">{profile.country || "—"}</dd>
                      </div>
                      <div className="flex py-4">
                        <dt className="w-1/3 text-sm font-semibold text-muted">University</dt>
                        <dd className="flex-1 text-text-dark">{profile.university || "—"}</dd>
                      </div>
                      <div className="flex py-4">
                        <dt className="w-1/3 text-sm font-semibold text-muted">Role</dt>
                        <dd className="flex-1 text-text-dark capitalize">{profile.role}</dd>
                      </div>
                      <div className="flex py-4">
                        <dt className="w-1/3 text-sm font-semibold text-muted">Language</dt>
                        <dd className="flex-1 text-text-dark">{profile.language || "—"}</dd>
                      </div>
                      <div className="flex py-4">
                        <dt className="w-1/3 text-sm font-semibold text-muted">Language Level</dt>
                        <dd className="flex-1 text-text-dark">{profile.language_level || "—"}</dd>
                      </div>
                    </dl>
                  )}
                </div>

                {/* Password change */}
                <div className="card p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-navy">Change password</h3>
                    {!changingPwd && (
                      <button
                        onClick={() => {
                          setChangingPwd(true);
                          setPwdError("");
                        }}
                        className="btn-secondary"
                      >
                        Change password
                      </button>
                    )}
                  </div>

                  {changingPwd ? (
                    <form onSubmit={handlePwdSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-text-dark mb-2">
                          Current password
                        </label>
                        <input
                          type="password"
                          required
                          value={pwdForm.current_password}
                          onChange={(e) =>
                            setPwdForm({ ...pwdForm, current_password: e.target.value })
                          }
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-text-dark mb-2">
                          New password
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={pwdForm.new_password}
                          onChange={(e) =>
                            setPwdForm({ ...pwdForm, new_password: e.target.value })
                          }
                          className="input-field"
                          placeholder="At least 6 characters"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-text-dark mb-2">
                          Confirm new password
                        </label>
                        <input
                          type="password"
                          required
                          value={pwdForm.confirm_password}
                          onChange={(e) =>
                            setPwdForm({ ...pwdForm, confirm_password: e.target.value })
                          }
                          className="input-field"
                        />
                      </div>

                      {pwdError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3">
                          {pwdError}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setChangingPwd(false);
                            setPwdError("");
                            setPwdForm({ current_password: "", new_password: "", confirm_password: "" });
                          }}
                          className="btn-secondary flex-1"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={changePwdMutation.isPending}
                          className="btn-primary flex-1 disabled:opacity-60"
                        >
                          {changePwdMutation.isPending ? "Saving..." : "Save password"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-sm text-muted">
                      Keep your account secure by using a strong password.
                    </p>
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
