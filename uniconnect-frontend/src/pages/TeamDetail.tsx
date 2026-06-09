import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/Toast";
import { useAuthStore } from "../store/authStore";
import { apiGet, apiDelete, apiPost } from "../api/axios";

interface TeamMemberDetail {
  user_id: string;
  name: string;
  avatar_url: string;
  role: string;
  language: string;
  language_level: string;
  joined_at: string;
}

interface TeamTaskDetail {
  id: string;
  team_id: string;
  task_id: string;
  status: string;
  assigned_at: string;
  completed_at: string;
  title: string;
  description: string;
  xp_reward: number;
  team_name?: string;
  submission_text: string;
}

interface TeamActivityEntry {
  id: string;
  team_id: string;
  action: string;
  description: string;
  xp_gained: number;
  created_at: string;
  user_name?: string;
}

interface TeamDetail {
  id: string;
  name: string;
  language: string;
  language_level: string;
  description: string;
  avatar_url: string;
  total_xp: number;
  member_count: number;
  rank: number;
  created_at: string;
  members: TeamMemberDetail[];
  tasks: TeamTaskDetail[];
  activities: TeamActivityEntry[];
}

function TeamAvatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClasses = {
    sm: "w-10 h-10 text-base",
    md: "w-14 h-14 text-xl",
    lg: "w-20 h-20 text-3xl",
    xl: "w-24 h-24 text-4xl",
  };

  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-red-500",
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-extrabold flex-shrink-0`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isAuthenticated, user } = useAuthStore();

  const [section, setSection] = useState<"members" | "tasks" | "activity">(
    "members"
  );
  const [submittingTask, setSubmittingTask] = useState<TeamTaskDetail | null>(null);

  const teamQuery = useQuery({
    queryKey: ["teams", id],
    queryFn: () => apiGet<TeamDetail>(`/api/teams/${id}`),
    enabled: !!id,
  });

  const myTeamQuery = useQuery({
    queryKey: ["teams", "my"],
    queryFn: () => apiGet<{ id: string } | null>("/api/teams/my"),
    enabled: isAuthenticated,
  });

  const leaveMutation = useMutation({
    mutationFn: () => apiDelete<{ status: string }>(`/api/teams/${id}/leave`),
    onSuccess: () => {
      toast.success("You have left the team.");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["teams", "my"] });
      navigate("/teams");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (teamQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-light">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner label="Loading team..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (teamQuery.isError || !teamQuery.data) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-light">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3">
              {(teamQuery.error as Error)?.message || "Failed to load team"}
            </div>
            <button
              onClick={() => navigate("/teams")}
              className="btn-secondary mt-4"
            >
              ← Back to Teams
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const team = teamQuery.data;
  const myTeamId = myTeamQuery.data?.id || null;
  const isMyTeam = myTeamId === team.id;
  const inProgressTasks = (team.tasks || []).filter(
    (t) => t.status === "assigned" || t.status === "submitted"
  );
  const completedTasks = (team.tasks || []).filter(
    (t) => t.status === "completed"
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />

      <main className="flex-1">
        <section className="bg-navy text-white py-4">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate("/teams")}
              className="text-gray-300 hover:text-white text-sm flex items-center gap-1 transition-colors"
            >
              ← Back to Teams
            </button>
          </div>
        </section>

        <section className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Team header card */}
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <TeamAvatar
                  name={team.name}
                  avatarUrl={team.avatar_url}
                  size="xl"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-2xl font-extrabold text-navy">
                      {team.name}
                    </h1>
                    {isMyTeam && (
                      <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-semibold">
                        Your Team
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded font-semibold">
                      {team.language}
                    </span>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded font-semibold">
                      {team.language_level}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <span className="text-yellow-600 font-bold text-lg">
                      ⭐ {team.total_xp.toLocaleString()} XP
                    </span>
                    {team.rank > 0 && (
                      <span className="text-muted">
                        Rank{" "}
                        <span
                          className={
                            team.rank === 1
                              ? "text-yellow-500 font-bold"
                              : team.rank === 2
                              ? "text-gray-400 font-bold"
                              : team.rank === 3
                              ? "text-orange-400 font-bold"
                              : "font-bold text-navy"
                          }
                        >
                          #{team.rank}
                        </span>
                      </span>
                    )}
                    <span className="text-muted">
                      {team.member_count}/4 members
                    </span>
                  </div>

                  {team.description && (
                    <p className="text-sm text-text-dark mt-2">
                      {team.description}
                    </p>
                  )}
                </div>

                {isMyTeam && (
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to leave this team? You will lose your membership."
                        )
                      ) {
                        leaveMutation.mutate();
                      }
                    }}
                    disabled={leaveMutation.isPending}
                    className="btn-danger text-sm self-start disabled:opacity-60"
                  >
                    {leaveMutation.isPending ? "Leaving..." : "Leave Team"}
                  </button>
                )}
              </div>

              <div className="mt-4 text-xs text-muted">
                Created {formatDate(team.created_at)}
              </div>
            </div>

            {/* Section tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-2">
              <button
                onClick={() => setSection("members")}
                className={`tab-button ${
                  section === "members"
                    ? "tab-button-active"
                    : "tab-button-inactive"
                }`}
              >
                👥 Members ({team.members?.length || 0})
              </button>
              <button
                onClick={() => setSection("tasks")}
                className={`tab-button ${
                  section === "tasks"
                    ? "tab-button-active"
                    : "tab-button-inactive"
                }`}
              >
                🎯 Tasks ({team.tasks?.length || 0})
              </button>
              <button
                onClick={() => setSection("activity")}
                className={`tab-button ${
                  section === "activity"
                    ? "tab-button-active"
                    : "tab-button-inactive"
                }`}
              >
                📋 Activity
              </button>
            </div>

            {/* Members section */}
            {section === "members" && (
              <div>
                {!team.members || team.members.length === 0 ? (
                  <div className="card p-8 text-center text-muted text-sm">
                    No members yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {team.members.map((member) => (
                      <div key={member.user_id} className="card p-4">
                        <div className="flex items-center gap-3">
                          <MemberAvatar
                            name={member.name}
                            avatarUrl={member.avatar_url}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-navy truncate">
                                {member.name}
                              </span>
                              {member.role === "leader" ? (
                                <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                                  Leader
                                </span>
                              ) : (
                                <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                                  Member
                                </span>
                              )}
                              {member.user_id === user?.id && (
                                <span className="text-xs text-primary font-semibold flex-shrink-0">
                                  (you)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                {member.language}
                              </span>
                              <span className="text-xs bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded">
                                {member.language_level}
                              </span>
                            </div>
                            <div className="text-xs text-muted mt-1">
                              Joined {formatDate(member.joined_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tasks section */}
            {section === "tasks" && (
              <div className="space-y-6">
                {/* In Progress */}
                <div>
                  <h3 className="text-base font-bold text-navy mb-3">
                    In Progress
                    {inProgressTasks.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-muted">
                        ({inProgressTasks.length})
                      </span>
                    )}
                  </h3>
                  {inProgressTasks.length === 0 ? (
                    <div className="card p-6 text-center text-muted text-sm border-dashed">
                      No tasks in progress.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inProgressTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          canSubmit={isMyTeam && task.status === "assigned"}
                          onSubmit={() => setSubmittingTask(task)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Completed */}
                <div>
                  <h3 className="text-base font-bold text-navy mb-3">
                    Completed
                    {completedTasks.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-muted">
                        ({completedTasks.length})
                      </span>
                    )}
                  </h3>
                  {completedTasks.length === 0 ? (
                    <div className="card p-6 text-center text-muted text-sm border-dashed">
                      No completed tasks yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {completedTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                    </div>
                  )}
                </div>

                {team.tasks?.length === 0 && (
                  <div className="card p-8 text-center text-muted text-sm">
                    No tasks assigned to this team yet.
                  </div>
                )}
              </div>
            )}

            {/* Activity section */}
            {section === "activity" && (
              <div>
                {!team.activities || team.activities.length === 0 ? (
                  <div className="card p-8 text-center text-muted text-sm">
                    No activity yet.
                  </div>
                ) : (
                  <div className="card divide-y divide-gray-100">
                    {team.activities.map((entry) => (
                      <div key={entry.id} className="px-5 py-4 flex items-start gap-3">
                        <div className="text-xl flex-shrink-0 mt-0.5">
                          {entry.xp_gained > 0 ? "⭐" : "👤"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-dark">
                            {entry.description}
                            {entry.user_name && (
                              <span className="text-muted"> — {entry.user_name}</span>
                            )}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted">
                              {timeAgo(entry.created_at)}
                            </span>
                            {entry.xp_gained > 0 && (
                              <span className="text-xs text-yellow-600 font-bold">
                                +{entry.xp_gained} XP
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {submittingTask && (
        <SubmitTaskModal
          task={submittingTask}
          onClose={() => setSubmittingTask(null)}
          onSuccess={() => {
            setSubmittingTask(null);
            queryClient.invalidateQueries({ queryKey: ["teams", id] });
          }}
        />
      )}

      <Footer />
    </div>
  );
}

function MemberAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string;
}) {
  const colors = [
    "bg-blue-400",
    "bg-purple-400",
    "bg-green-400",
    "bg-orange-400",
    "bg-pink-400",
    "bg-teal-400",
    "bg-indigo-400",
    "bg-red-400",
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function TaskCard({
  task,
  canSubmit = false,
  onSubmit,
}: {
  task: TeamTaskDetail;
  canSubmit?: boolean;
  onSubmit?: () => void;
}) {
  const isCompleted = task.status === "completed";
  const isSubmitted = task.status === "submitted";

  return (
    <div
      className={`card p-4 ${
        isCompleted
          ? "bg-green-50 border-green-200"
          : isSubmitted
          ? "bg-blue-50 border-blue-200"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-semibold text-navy">{task.title}</h4>
            <span className="text-xs text-yellow-600 font-bold bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded">
              ⭐ {task.xp_reward} XP
            </span>
            {isCompleted ? (
              <span className="badge-green text-xs">Completed</span>
            ) : isSubmitted ? (
              <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-semibold">
                Awaiting Review
              </span>
            ) : (
              <span className="badge-yellow text-xs">In Progress</span>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-muted line-clamp-2">{task.description}</p>
          )}
          {isSubmitted && task.submission_text && (
            <div className="mt-2 p-2.5 bg-white border border-blue-200 rounded text-sm text-text-dark">
              <span className="text-xs font-semibold text-muted block mb-1">Your submission:</span>
              {task.submission_text}
            </div>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted flex-wrap">
            <span>Assigned: {formatDate(task.assigned_at)}</span>
            {isCompleted && task.completed_at && (
              <span className="text-green-600">
                Completed: {formatDate(task.completed_at)}
              </span>
            )}
          </div>
        </div>
        {canSubmit && (
          <button
            onClick={onSubmit}
            className="btn-primary text-sm flex-shrink-0 self-start"
          >
            Submit
          </button>
        )}
        {isSubmitted && (
          <span className="text-xs text-blue-600 font-semibold flex-shrink-0 self-start mt-1">
            ⏳ Under review
          </span>
        )}
      </div>
    </div>
  );
}

function SubmitTaskModal({
  task,
  onClose,
  onSuccess,
}: {
  task: TeamTaskDetail;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [text, setText] = useState("");

  const submitMutation = useMutation({
    mutationFn: () =>
      apiPost<{ status: string }>(`/api/team-tasks/${task.id}/submit`, {
        submission_text: text,
      }),
    onSuccess: () => {
      toast.success("Task submitted for review!");
      onSuccess();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) submitMutation.mutate();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-md max-w-lg w-full shadow-2xl border-t-4 border-primary"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div>
              <h2 className="text-xl font-bold text-navy">Submit task</h2>
              <p className="text-sm text-muted mt-1">
                Describe what your team did to complete{" "}
                <span className="font-semibold text-text-dark">"{task.title}"</span>.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-primary text-2xl flex-shrink-0"
            >
              ×
            </button>
          </div>

          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            ⭐ Your team will earn <strong>{task.xp_reward} XP</strong> once the
            admin approves this submission.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text-dark mb-2">
                Submission
              </label>
              <textarea
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="Describe what your team did, include links, results, or any evidence of completion…"
                className="input-field resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitMutation.isPending || !text.trim()}
                className="btn-primary flex-1 disabled:opacity-60"
              >
                {submitMutation.isPending ? "Submitting…" : "Submit for review"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
