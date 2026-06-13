import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/Toast";
import { useAuthStore } from "../store/authStore";
import { apiGet, apiPost } from "../api/axios";

interface TeamSummary {
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
}

function TeamAvatar({ name, avatarUrl, size = "md" }: { name: string; avatarUrl?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "w-16 h-16 text-2xl" : size === "sm" ? "w-8 h-8 text-sm" : "w-12 h-12 text-lg";
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    );
  }
  const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-pink-500", "bg-orange-500", "bg-teal-500"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function TeamCard({
  team,
  myTeamId,
  canJoin = false,
  onJoin,
  joining = false,
}: {
  team: TeamSummary;
  myTeamId?: string | null;
  canJoin?: boolean;
  onJoin?: (id: string) => void;
  joining?: boolean;
}) {
  const navigate = useNavigate();
  const isMyTeam = myTeamId === team.id;
  const isFull = team.member_count >= 4;

  return (
    <div
      className={`card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${isMyTeam ? "ring-2 ring-primary" : ""}`}
      onClick={() => navigate(`/teams/${team.id}`)}
    >
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <TeamAvatar name={team.name} avatarUrl={team.avatar_url} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-navy truncate">{team.name}</h3>
              {isMyTeam && (
                <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                  Your Team
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">{team.language}</span>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">{team.language_level}</span>
            </div>
          </div>
        </div>

        {team.description && (
          <p className="text-sm text-text-dark line-clamp-2 mb-3">{team.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted mb-3">
          <span className={`font-medium ${isFull ? "text-red-500" : "text-green-600"}`}>
            {team.member_count}/4 members
          </span>
          <span className="text-yellow-600 font-bold">&#9733; {team.total_xp} XP</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">
            {new Date(team.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          {canJoin && !isMyTeam && !isFull && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJoin?.(team.id);
              }}
              disabled={joining}
              className="btn-primary text-xs py-1.5 px-3 disabled:opacity-60"
            >
              {joining ? "Joining..." : "Join"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Basic UUID v4-ish shape check so we can give instant feedback before hitting the API.
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function JoinByIdModal({
  onClose,
  onJoin,
  joining,
}: {
  onClose: () => void;
  onJoin: (id: string) => void;
  joining: boolean;
}) {
  const [teamId, setTeamId] = useState("");
  const trimmed = teamId.trim();
  const valid = UUID_RE.test(trimmed);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-navy">Join a Team by ID</h3>
          <button onClick={onClose} className="text-muted hover:text-text-dark text-2xl leading-none" aria-label="Close">
            &times;
          </button>
        </div>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (valid) onJoin(trimmed);
          }}
          className="px-6 py-5 space-y-4"
        >
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded px-4 py-3 text-sm">
            Ask a teammate for their <strong>Team ID</strong> (shown on their team page) and paste it
            below. Your language and level must match the team, and the team must have an open slot.
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-dark mb-1">
              Team ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="input-field font-mono text-sm"
              placeholder="e.g. 3f8c1e2a-1b2c-4d5e-8f90-0a1b2c3d4e5f"
            />
            {trimmed.length > 0 && !valid && (
              <p className="text-xs text-red-500 mt-1">That doesn't look like a valid Team ID.</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              type="submit"
              disabled={!valid || joining}
              className="btn-primary flex-1 disabled:opacity-60"
            >
              {joining ? "Joining..." : "Join Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateTeamModal({
  language,
  level,
  onClose,
  onSave,
  saving,
}: {
  language: string;
  level: string;
  onClose: () => void;
  onSave: (form: { name: string; description: string; avatar_url: string }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({ name: "", description: "", avatar_url: "" });

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-navy">Create a Team</h3>
          <button onClick={onClose} className="text-muted hover:text-text-dark text-2xl leading-none" aria-label="Close">
            &times;
          </button>
        </div>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            onSave(form);
          }}
          className="px-6 py-5 space-y-4"
        >
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded px-4 py-3 text-sm">
            Your team will be created for <strong>{language} ({level})</strong> speakers.
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-dark mb-1">Team name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              placeholder="e.g. English Masters"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-dark mb-1">Description <span className="text-muted font-normal">(optional)</span></label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="input-field"
              placeholder="Tell others what makes your team special..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-dark mb-1">Avatar URL <span className="text-muted font-normal">(optional)</span></label>
            <input
              type="url"
              value={form.avatar_url}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              className="input-field"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
              {saving ? "Creating..." : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Teams() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isAuthenticated, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"all" | "leaderboard">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinById, setShowJoinById] = useState(false);

  const leaderboardQuery = useQuery({
    queryKey: ["teams", "leaderboard"],
    queryFn: () => apiGet<TeamSummary[]>("/api/teams/leaderboard"),
    enabled: activeTab === "leaderboard",
  });

  const myTeamQuery = useQuery({
    queryKey: ["teams", "my"],
    queryFn: () => apiGet<TeamSummary | null>("/api/teams/my"),
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: (body: { name: string; description: string; avatar_url: string }) =>
      apiPost<{ id: string }>("/api/teams", body),
    onSuccess: (data) => {
      toast.success("Team created successfully!");
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      navigate(`/teams/${data.id}`);
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create team"),
  });

  // Joining by a pasted Team ID navigates straight to the team on success.
  const joinByIdMutation = useMutation({
    mutationFn: (id: string) => apiPost<TeamSummary>(`/api/teams/${id}/join`, {}),
    onSuccess: (_data, id) => {
      toast.success("Joined team successfully!");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["teams", "my"] });
      setShowJoinById(false);
      navigate(`/teams/${id}`);
    },
    onError: (e: Error) => toast.error(e.message || "Failed to join team"),
  });

  const myTeam = myTeamQuery.data ?? null;
  const hasLanguage = !!(user?.language && user?.language_level);
  const canCreateTeam = isAuthenticated && hasLanguage && !myTeam;

  const leaderboard = leaderboardQuery.data || [];

  const rankStyle = (rank: number) => {
    if (rank === 1) return "text-yellow-500 font-extrabold text-xl";
    if (rank === 2) return "text-gray-400 font-extrabold text-xl";
    if (rank === 3) return "text-orange-400 font-extrabold text-xl";
    return "text-muted font-bold text-lg";
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-navy text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest mb-2">
              Gamification
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold">Language Teams</h1>
            <p className="text-gray-300 mt-2 max-w-2xl">
              Join a language learning team, complete tasks, and climb the leaderboard. Earn XP and improve your skills together.
            </p>
          </div>
        </section>

        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Sub-tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
              <button
                onClick={() => setActiveTab("all")}
                className={`tab-button ${activeTab === "all" ? "tab-button-active" : "tab-button-inactive"}`}
              >
                My Team
              </button>
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`tab-button ${activeTab === "leaderboard" ? "tab-button-active" : "tab-button-inactive"}`}
              >
                Leaderboard
              </button>
            </div>

            {activeTab === "all" && (
              <>
                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className="flex-1" />
                  {canCreateTeam && (
                    <>
                      <button onClick={() => setShowJoinById(true)} className="btn-secondary">
                        Join by ID
                      </button>
                      <button onClick={() => setShowCreate(true)} className="btn-primary">
                        + Create Team
                      </button>
                    </>
                  )}
                </div>

                {!isAuthenticated ? (
                  <div className="text-center text-muted py-12 bg-white rounded-md border border-dashed border-gray-200">
                    Please log in to view or join a team.
                  </div>
                ) : myTeamQuery.isLoading ? (
                  <LoadingSpinner label="Loading your team..." />
                ) : myTeam ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <TeamCard team={myTeam} myTeamId={myTeam.id} />
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-md border border-dashed border-gray-200 px-6">
                    <p className="text-navy font-semibold mb-1">You're not in a team yet</p>
                    <p className="text-muted text-sm mb-4 max-w-md mx-auto">
                      Teams are private — you can't browse them. Create your own team, or join an
                      existing one with a <strong>Team ID</strong> shared by a teammate.
                    </p>
                    {canCreateTeam ? (
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => setShowJoinById(true)} className="btn-secondary">
                          Join by ID
                        </button>
                        <button onClick={() => setShowCreate(true)} className="btn-primary">
                          + Create Team
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted">
                        Set your language and level in your profile to create or join a team.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === "leaderboard" && (
              <>
                {leaderboardQuery.isLoading ? (
                  <LoadingSpinner label="Loading leaderboard..." />
                ) : leaderboardQuery.isError ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3">
                    {(leaderboardQuery.error as Error)?.message || "Failed to load leaderboard"}
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center text-muted py-12 bg-white rounded-md border border-dashed border-gray-200">
                    No teams on the leaderboard yet.
                  </div>
                ) : (
                  <div className="card overflow-hidden">
                    {leaderboard.map((team, idx) => {
                      const rank = idx + 1;
                      const isTopThree = rank <= 3;
                      return (
                        <div
                          key={team.id}
                          onClick={() => navigate(`/teams/${team.id}`)}
                          className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-bg-light transition-colors border-b border-gray-100 last:border-0 ${
                            isTopThree ? "bg-gradient-to-r from-yellow-50/30 to-transparent" : ""
                          } ${myTeam?.id === team.id ? "bg-primary/5" : ""}`}
                        >
                          <div className={`w-10 text-center flex-shrink-0 ${rankStyle(rank)}`}>
                            {rank <= 3 ? (rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉") : `#${rank}`}
                          </div>
                          <TeamAvatar name={team.name} avatarUrl={team.avatar_url} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-navy">{team.name}</span>
                              {myTeam?.id === team.id && (
                                <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-semibold">
                                  Your Team
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">{team.language}</span>
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">{team.language_level}</span>
                              <span className="text-xs text-muted">{team.member_count}/4 members</span>
                            </div>
                          </div>
                          <div className="text-yellow-600 font-bold text-sm flex-shrink-0">
                            &#9733; {team.total_xp} XP
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {showCreate && (
        <CreateTeamModal
          language={user?.language || ""}
          level={user?.language_level || ""}
          onClose={() => setShowCreate(false)}
          onSave={(form) => createMutation.mutate(form)}
          saving={createMutation.isPending}
        />
      )}

      {showJoinById && (
        <JoinByIdModal
          onClose={() => setShowJoinById(false)}
          onJoin={(id) => joinByIdMutation.mutate(id)}
          joining={joinByIdMutation.isPending}
        />
      )}
    </div>
  );
}
