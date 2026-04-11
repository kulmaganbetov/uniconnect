import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import { apiGet, apiPost } from "../api/axios";

interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  salary: string;
  schedule: string;
  location: string;
  requirements: string;
  contact_email: string;
  created_at: string;
}

interface JobApplication {
  id: string;
  user_id: string;
  job_id: string;
  status: string;
  created_at: string;
}

export default function Jobs() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const jobsQuery = useQuery({
    queryKey: ["jobs"],
    queryFn: () => apiGet<Job[]>("/api/jobs"),
  });

  const appsQuery = useQuery({
    queryKey: ["my-job-applications"],
    queryFn: () => apiGet<JobApplication[]>("/api/jobs/my-applications"),
  });

  const applyMutation = useMutation({
    mutationFn: (job_id: string) =>
      apiPost<JobApplication>("/api/jobs/apply", { job_id }),
    onSuccess: (data) => {
      setAppliedId(data.job_id);
      queryClient.invalidateQueries({ queryKey: ["my-job-applications"] });
      setTimeout(() => setAppliedId(null), 4000);
    },
  });

  const appliedJobIds = new Set(
    (appsQuery.data || []).map((app) => app.job_id)
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />

      <main className="flex-1">
        <section className="bg-navy text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest mb-2">
              Career
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold">
              Part-time & temporary jobs
            </h1>
            <p className="text-gray-300 mt-2 max-w-2xl">
              Student-friendly positions across Kazakhstan. Flexible
              schedules, fair pay, and real experience.
            </p>
          </div>
        </section>

        {appliedId && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="bg-green-50 border border-green-200 text-green-800 rounded px-4 py-3 text-sm">
              Your application has been submitted. The employer will contact
              you by email.
            </div>
          </div>
        )}

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-navy mb-6">Open positions</h2>

            {jobsQuery.isLoading ? (
              <LoadingSpinner label="Loading jobs..." />
            ) : jobsQuery.isError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3">
                {(jobsQuery.error as Error)?.message || "Failed to load jobs"}
              </div>
            ) : (
              <div className="space-y-4">
                {(jobsQuery.data || []).map((job) => {
                  const isExpanded = expanded === job.id;
                  const hasApplied = appliedJobIds.has(job.id);
                  return (
                    <div key={job.id} className="card p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-navy mb-1">
                            {job.title}
                          </h3>
                          <div className="text-sm text-primary font-semibold mb-3">
                            {job.company}
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="badge-gray">{job.location}</span>
                            <span className="badge-gray">{job.schedule}</span>
                            <span className="badge-red">{job.salary}</span>
                          </div>
                          <p
                            className={`text-sm text-text-dark leading-relaxed ${
                              isExpanded ? "" : "line-clamp-2"
                            }`}
                          >
                            {job.description}
                          </p>
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                              <div>
                                <div className="text-xs uppercase tracking-wider text-muted font-bold mb-1">
                                  Requirements
                                </div>
                                <p className="text-sm text-text-dark">
                                  {job.requirements}
                                </p>
                              </div>
                              <div>
                                <div className="text-xs uppercase tracking-wider text-muted font-bold mb-1">
                                  Contact
                                </div>
                                <a
                                  href={`mailto:${job.contact_email}`}
                                  className="text-sm text-primary hover:underline"
                                >
                                  {job.contact_email}
                                </a>
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() =>
                              setExpanded(isExpanded ? null : job.id)
                            }
                            className="text-primary text-sm font-semibold mt-3 hover:underline"
                          >
                            {isExpanded ? "Show less" : "Show more"}
                          </button>
                        </div>
                        <div className="md:text-right md:w-48">
                          <button
                            onClick={() => applyMutation.mutate(job.id)}
                            disabled={hasApplied || applyMutation.isPending}
                            className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {hasApplied
                              ? "Applied"
                              : applyMutation.isPending
                              ? "Applying..."
                              : "Apply"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-navy mb-6">
              My applications
            </h2>

            {appsQuery.isLoading ? (
              <LoadingSpinner />
            ) : (appsQuery.data || []).length === 0 ? (
              <div className="card p-8 text-center text-muted text-sm">
                You haven't applied to any jobs yet.
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-bg-light">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-navy">
                        Job ID
                      </th>
                      <th className="text-left px-5 py-3 font-semibold text-navy">
                        Applied
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
                          {app.job_id.slice(0, 8)}...
                        </td>
                        <td className="px-5 py-4 text-text-dark">
                          {new Date(app.created_at).toLocaleDateString()}
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
      </main>

      <Footer />
    </div>
  );
}
