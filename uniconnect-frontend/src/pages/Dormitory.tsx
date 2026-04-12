import { FormEvent, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/Toast";
import { useAuthStore } from "../store/authStore";
import { apiGet, apiPost } from "../api/axios";

interface Dormitory {
  id: string;
  name: string;
  address: string;
  total_rooms: number;
  available_rooms: number;
  price_per_month: number;
  description: string;
  created_at: string;
}

interface DormApplication {
  id: string;
  user_id: string;
  dormitory_id: string;
  dormitory_name: string;
  status: string;
  message: string;
  created_at: string;
}

export default function Dormitory() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const [selected, setSelected] = useState<Dormitory | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    student_id: "",
    room_type: "double",
    message: "",
  });

  const dormsQuery = useQuery({
    queryKey: ["dormitories"],
    queryFn: () => apiGet<Dormitory[]>("/api/dormitory"),
  });

  const appsQuery = useQuery({
    queryKey: ["my-dorm-applications"],
    queryFn: () =>
      apiGet<DormApplication[]>("/api/dormitory/my-applications"),
  });

  const applyMutation = useMutation({
    mutationFn: (body: { dormitory_id: string; message: string }) =>
      apiPost<DormApplication>("/api/dormitory/apply", body),
    onSuccess: () => {
      toast.success("Application submitted! We'll notify you once it's reviewed.");
      setSelected(null);
      setForm({ full_name: "", phone: "", student_id: "", room_type: "double", message: "" });
      queryClient.invalidateQueries({ queryKey: ["my-dorm-applications"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit application");
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    // Pack all student info into the message field
    const fullMessage = [
      `Full name: ${form.full_name}`,
      `Phone: ${form.phone}`,
      `Student ID: ${form.student_id}`,
      `Preferred room: ${form.room_type === "single" ? "Single" : "Double (shared)"}`,
      form.message ? `\nAdditional notes:\n${form.message}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    applyMutation.mutate({
      dormitory_id: selected.id,
      message: fullMessage,
    });
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <span className="badge-green">Approved</span>;
    if (status === "rejected") return <span className="badge-red">Rejected</span>;
    return <span className="badge-yellow">Pending</span>;
  };

  // Pre-fill name from profile
  const openApplyModal = (dorm: Dormitory) => {
    setSelected(dorm);
    setForm((f) => ({ ...f, full_name: f.full_name || user?.name || "" }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-navy text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest mb-2">
              Housing
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold">
              Narxoz University Dormitories
            </h1>
            <p className="text-gray-300 mt-2 max-w-2xl">
              Browse available dormitories and submit your application online.
              Fill in your details and the housing office will review your
              request.
            </p>
          </div>
        </section>

        {/* Dormitories list */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-navy mb-6">
              Available dormitories
            </h2>

            {dormsQuery.isLoading ? (
              <LoadingSpinner label="Loading dormitories..." />
            ) : dormsQuery.isError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3">
                {(dormsQuery.error as Error)?.message ||
                  "Failed to load dormitories"}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(dormsQuery.data || []).map((dorm) => (
                  <div key={dorm.id} className="card overflow-hidden">
                    <div className="h-40 bg-gradient-to-br from-navy to-primary flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-white/40"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-navy mb-1">
                        {dorm.name}
                      </h3>
                      <p className="text-xs text-muted mb-4">{dorm.address}</p>
                      <p className="text-sm text-text-dark line-clamp-3 mb-5">
                        {dorm.description}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-5">
                        <div className="bg-bg-light px-3 py-2 rounded">
                          <div className="text-muted">Available</div>
                          <div className="font-bold text-navy">
                            {dorm.available_rooms}/{dorm.total_rooms} rooms
                          </div>
                        </div>
                        <div className="bg-bg-light px-3 py-2 rounded">
                          <div className="text-muted">Per month</div>
                          <div className="font-bold text-primary">
                            {dorm.price_per_month.toLocaleString()} KZT
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => openApplyModal(dorm)}
                        disabled={dorm.available_rooms === 0}
                        className="btn-primary w-full disabled:opacity-50"
                      >
                        {dorm.available_rooms === 0 ? "No rooms available" : "Apply now"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* My applications */}
        <section className="pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-navy mb-6">
              My applications
            </h2>

            {appsQuery.isLoading ? (
              <LoadingSpinner />
            ) : appsQuery.isError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3">
                {(appsQuery.error as Error)?.message ||
                  "Failed to load applications"}
              </div>
            ) : (appsQuery.data || []).length === 0 ? (
              <div className="card p-8 text-center text-muted text-sm">
                You haven't submitted any dormitory applications yet.
              </div>
            ) : (
              <div className="space-y-3">
                {(appsQuery.data || []).map((app) => (
                  <div key={app.id} className="card p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-navy">
                          {app.dormitory_name || "Dormitory"}
                        </h3>
                        <div className="text-xs text-muted mt-1">
                          Submitted{" "}
                          {new Date(app.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      <div>{statusBadge(app.status)}</div>
                    </div>
                    {app.message && (
                      <pre className="text-xs text-muted mt-3 whitespace-pre-wrap font-sans bg-bg-light rounded p-3">
                        {app.message}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Apply modal */}
        {selected && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 animate-fade-in"
            onClick={() => setSelected(null)}
          >
            <div
              className="bg-white rounded-lg max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-navy">
                    Apply for {selected.name}
                  </h3>
                  <p className="text-xs text-muted">{selected.address}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-muted hover:text-text-dark text-2xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div className="bg-bg-light rounded p-3 text-xs text-muted">
                  <strong className="text-text-dark">
                    {selected.price_per_month.toLocaleString()} KZT/month
                  </strong>{" "}
                  · {selected.available_rooms} rooms available out of{" "}
                  {selected.total_rooms}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-dark mb-1">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                    className="input-field"
                    placeholder="Your full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-dark mb-1">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className="input-field"
                      placeholder="+7 7XX XXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-dark mb-1">
                      Student ID
                    </label>
                    <input
                      type="text"
                      required
                      value={form.student_id}
                      onChange={(e) =>
                        setForm({ ...form, student_id: e.target.value })
                      }
                      className="input-field"
                      placeholder="e.g. NRX-24001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-dark mb-1">
                    Preferred room type
                  </label>
                  <select
                    value={form.room_type}
                    onChange={(e) =>
                      setForm({ ...form, room_type: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="single">Single room</option>
                    <option value="double">Double room (shared)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-dark mb-1">
                    Additional notes{" "}
                    <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    rows={3}
                    className="input-field"
                    placeholder="Any special requirements, move-in date preferences, etc."
                  />
                </div>

                {applyMutation.isError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3">
                    {(applyMutation.error as Error)?.message ||
                      "Failed to submit"}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applyMutation.isPending}
                    className="btn-primary flex-1 disabled:opacity-60"
                  >
                    {applyMutation.isPending ? "Submitting..." : "Submit application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
