import { FormEvent, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import { apiGet, apiPost } from "../api/axios";

interface MedicalService {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  working_hours: string;
  description: string;
  is_free: boolean;
  image_url: string;
}

interface MedicalAppointment {
  id: string;
  user_id: string;
  service_id: string;
  date: string;
  time: string;
  status: string;
  created_at: string;
}

export default function Medical() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<MedicalService | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [bookedId, setBookedId] = useState<string | null>(null);

  const servicesQuery = useQuery({
    queryKey: ["medical-services"],
    queryFn: () => apiGet<MedicalService[]>("/api/medical"),
  });

  const appointmentsQuery = useQuery({
    queryKey: ["my-appointments"],
    queryFn: () =>
      apiGet<MedicalAppointment[]>("/api/medical/my-appointments"),
  });

  const bookMutation = useMutation({
    mutationFn: (body: {
      service_id: string;
      date: string;
      time: string;
    }) => apiPost<MedicalAppointment>("/api/medical/appointment", body),
    onSuccess: (data) => {
      setBookedId(data.id);
      setSelected(null);
      setDate("");
      setTime("");
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      setTimeout(() => setBookedId(null), 4000);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    bookMutation.mutate({
      service_id: selected.id,
      date,
      time,
    });
  };

  const typeBadge = (type: string) => {
    const map: Record<string, string> = {
      clinic: "bg-blue-100 text-blue-700",
      hospital: "bg-red-100 text-red-700",
      pharmacy: "bg-green-100 text-green-700",
    };
    const cls = map[type] || "bg-gray-100 text-gray-700";
    return (
      <span
        className={`badge ${cls} capitalize`}
      >
        {type}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />

      <main className="flex-1">
        <section className="bg-navy text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest mb-2">
              Healthcare
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold">
              Medical services
            </h1>
            <p className="text-gray-300 mt-2 max-w-2xl">
              Find clinics, pharmacies, and hospitals that welcome
              international students. Many services are free.
            </p>
          </div>
        </section>

        {bookedId && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="bg-green-50 border border-green-200 text-green-800 rounded px-4 py-3 text-sm">
              Appointment booked successfully. You'll see the details below.
            </div>
          </div>
        )}

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-navy mb-6">
              Available services
            </h2>

            {servicesQuery.isLoading ? (
              <LoadingSpinner label="Loading services..." />
            ) : servicesQuery.isError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3">
                {(servicesQuery.error as Error)?.message ||
                  "Failed to load services"}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(servicesQuery.data || []).map((svc) => (
                  <div key={svc.id} className="card overflow-hidden">
                    {svc.image_url && (
                      <img
                        src={svc.image_url}
                        alt={svc.name}
                        className="w-full h-40 object-cover"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    )}
                    <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-navy mb-1">
                          {svc.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {typeBadge(svc.type)}
                          {svc.is_free && (
                            <span className="badge-green">Free</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-text-dark mb-4">
                      {svc.description}
                    </p>
                    <dl className="space-y-1 text-xs text-muted mb-5">
                      <div className="flex gap-2">
                        <dt className="font-semibold text-text-dark w-20">
                          Address:
                        </dt>
                        <dd>{svc.address}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="font-semibold text-text-dark w-20">
                          Phone:
                        </dt>
                        <dd>
                          <a
                            href={`tel:${svc.phone}`}
                            className="text-primary hover:underline"
                          >
                            {svc.phone}
                          </a>
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="font-semibold text-text-dark w-20">
                          Hours:
                        </dt>
                        <dd>{svc.working_hours}</dd>
                      </div>
                    </dl>
                    <button
                      onClick={() => setSelected(svc)}
                      className="btn-primary w-full"
                    >
                      Book appointment
                    </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-navy mb-6">
              My appointments
            </h2>

            {appointmentsQuery.isLoading ? (
              <LoadingSpinner />
            ) : appointmentsQuery.isError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3">
                {(appointmentsQuery.error as Error)?.message ||
                  "Failed to load appointments"}
              </div>
            ) : (appointmentsQuery.data || []).length === 0 ? (
              <div className="card p-8 text-center text-muted text-sm">
                You don't have any appointments yet.
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-bg-light">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-navy">
                        Service
                      </th>
                      <th className="text-left px-5 py-3 font-semibold text-navy">
                        Date
                      </th>
                      <th className="text-left px-5 py-3 font-semibold text-navy">
                        Time
                      </th>
                      <th className="text-left px-5 py-3 font-semibold text-navy">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(appointmentsQuery.data || []).map((app) => (
                      <tr key={app.id} className="border-t border-gray-100">
                        <td className="px-5 py-4 font-mono text-xs text-muted">
                          {app.service_id.slice(0, 8)}...
                        </td>
                        <td className="px-5 py-4 text-text-dark">
                          {new Date(app.date).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-text-dark">
                          {app.time}
                        </td>
                        <td className="px-5 py-4">
                          <span className="badge-yellow">{app.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Book modal */}
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
                  Book at {selected.name}
                </h3>
                <p className="text-xs text-muted mb-6">{selected.address}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-dark mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="input-field"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-dark mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  {bookMutation.isError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3">
                      {(bookMutation.error as Error)?.message ||
                        "Failed to book"}
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
                      disabled={bookMutation.isPending}
                      className="btn-primary flex-1 disabled:opacity-60"
                    >
                      {bookMutation.isPending ? "Booking..." : "Confirm"}
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
