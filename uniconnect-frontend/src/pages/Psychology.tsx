import { FormEvent, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import { apiGet, apiPost } from "../api/axios";

interface PsychologyRequest {
  id: string;
  user_id: string;
  topic: string;
  message: string;
  preferred_date: string;
  status: string;
  created_at: string;
}

const TOPICS = [
  "Homesickness & adaptation",
  "Academic stress",
  "Relationship issues",
  "Anxiety or depression",
  "Cultural shock",
  "Language barrier",
  "Financial stress",
  "Other",
];

export default function Psychology() {
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const requestsQuery = useQuery({
    queryKey: ["my-psychology-requests"],
    queryFn: () =>
      apiGet<PsychologyRequest[]>("/api/psychology/my-requests"),
  });

  const createMutation = useMutation({
    mutationFn: (body: {
      topic: string;
      message: string;
      preferred_date: string;
    }) => apiPost<PsychologyRequest>("/api/psychology/request", body),
    onSuccess: () => {
      setSubmitted(true);
      setMessage("");
      setPreferredDate("");
      setTopic(TOPICS[0]);
      queryClient.invalidateQueries({ queryKey: ["my-psychology-requests"] });
      setTimeout(() => setSubmitted(false), 5000);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      topic,
      message,
      preferred_date: preferredDate,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />

      <main className="flex-1">
        <section className="bg-navy text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest mb-2">
              Wellbeing
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold">
              Psychological support
            </h1>
            <p className="text-gray-300 mt-2 max-w-2xl">
              Free, confidential support from licensed counsellors. Submit a
              request and a specialist will reach out within 48 hours.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="card p-7 md:p-10">
                <h2 className="text-2xl font-bold text-navy mb-2">
                  Request a consultation
                </h2>
                <p className="text-sm text-muted mb-6">
                  All information stays strictly confidential between you and
                  your counsellor.
                </p>

                {submitted && (
                  <div className="bg-green-50 border border-green-200 text-green-800 rounded px-4 py-3 text-sm mb-5">
                    Your request has been received. A counsellor will contact
                    you soon.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-text-dark mb-2">
                      Topic
                    </label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="input-field"
                    >
                      {TOPICS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-dark mb-2">
                      Message
                    </label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      className="input-field"
                      placeholder="Briefly describe what's on your mind..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-dark mb-2">
                      Preferred consultation date
                    </label>
                    <input
                      type="date"
                      required
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="input-field"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  {createMutation.isError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3">
                      {(createMutation.error as Error)?.message ||
                        "Failed to submit"}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="btn-primary w-full disabled:opacity-60"
                  >
                    {createMutation.isPending
                      ? "Submitting..."
                      : "Submit request"}
                  </button>
                </form>
              </div>
            </div>

            {/* Info sidebar */}
            <div className="space-y-5">
              <div className="card p-6">
                <h3 className="font-bold text-navy mb-3">What to expect</h3>
                <ul className="space-y-2 text-sm text-muted">
                  <li className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>Free for all UniConnect students</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>Licensed multilingual counsellors</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>Response within 48 hours</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>Strictly confidential</span>
                  </li>
                </ul>
              </div>

              <div className="bg-primary text-white rounded-md p-6">
                <h3 className="font-bold mb-2">Crisis support</h3>
                <p className="text-sm text-white/90 mb-3">
                  If you are in immediate danger, please call emergency
                  services now.
                </p>
                <div className="text-2xl font-extrabold">112</div>
              </div>
            </div>
          </div>
        </section>

        {/* My requests */}
        <section className="pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-navy mb-6">My requests</h2>

            {requestsQuery.isLoading ? (
              <LoadingSpinner />
            ) : (requestsQuery.data || []).length === 0 ? (
              <div className="card p-8 text-center text-muted text-sm">
                You haven't submitted any requests yet.
              </div>
            ) : (
              <div className="space-y-3">
                {(requestsQuery.data || []).map((req) => (
                  <div key={req.id} className="card p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-bold text-navy">{req.topic}</div>
                      <span className="badge-yellow">{req.status}</span>
                    </div>
                    <p className="text-sm text-text-dark mb-3">
                      {req.message}
                    </p>
                    <div className="text-xs text-muted">
                      Preferred date:{" "}
                      {new Date(req.preferred_date).toLocaleDateString()}
                      {" · "}
                      Submitted:{" "}
                      {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
