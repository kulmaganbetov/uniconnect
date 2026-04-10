import { FormEvent, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
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
  status: string;
  message: string;
  created_at: string;
}

export default function Dormitory() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Dormitory | null>(null);
  const [message, setMessage] = useState("");
  const [successId, setSuccessId] = useState<string | null>(null);

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
    onSuccess: (data) => {
      setSuccessId(data.id);
      setSelected(null);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["my-dorm-applications"] });
      setTimeout(() => setSuccessId(null), 4000);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    applyMutation.mutate({
      dormitory_id: selected.id,
      message: message,
    });
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <span className="badge-green">Approved</span>;
    if (status === "rejected") return <span className="badge-red">Rejected</span>;
    return <span className="badge-yellow">Pending</span>;
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
              Student dormitories
            </h1>
            <p className="text-gray-300 mt-2 max-w-2xl">
              Browse available dormitories across Kazakhstan and submit your
              application online.
            </p>
          </div>
        </section>

        {/* Success message */}
        {successId && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="bg-green-50 border border-green-200 text-green-800 rounded px-4 py-3 text-sm">
              Your application has been submitted successfully. We'll update
              you soon.
            </div>
          </div>
        )}

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
                            {dorm.price_per_month} KZT
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelected(dorm)}
                        className="btn-primary w-full"
                      >
                        Apply now
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
                You haven't submitted any applications yet.
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-bg-light">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-navy">
                        Dormitory ID
                      </th>
                      <th className="text-left px-5 py-3 font-semibold text-navy">
                        Submitted
                      </th>
                      <th className="text-left px-5 py-3 font-semibold text-navy">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(appsQuery.data || []).map((app) => (
                      <tr key={app.id} className="border-t border-gray-100">
                        <td className="px-5 py-4 font-mono text-xs text-muted">
                          {app.dormitory_id.slice(0, 8)}...
                        </td>
                        <td className="px-5 py-4 text-text-dark">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4">{statusBadge(app.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Apply modal */}
        {selected && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
            onClick={() => setSelected(null)}
          >
            <div
              className="bg-white rounded-md max-w-md w-full shadow-2xl border-t-4 border-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-bold text-navy mb-1">
                  Apply for {selected.name}
                </h3>
                <p className="text-xs text-muted mb-6">{selected.address}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-dark mb-2">
                      Application message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="input-field"
                      placeholder="Tell us why you'd like to live here..."
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
                      {applyMutation.isPending ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
