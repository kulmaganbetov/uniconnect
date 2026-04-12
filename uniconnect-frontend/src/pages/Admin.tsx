import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import { apiDelete, apiGet, apiPost, apiPut } from "../api/axios";
import { useAuthStore } from "../store/authStore";
import { useToast } from "../components/Toast";
import {
  canAccessAdmin,
  canManageContent,
  canManageDorms,
  canManageGuides,
  canManageJobs,
  canManageMedical,
  canManagePsychology,
  canManageUsers,
  ROLE_LABELS,
  ROLES,
} from "../lib/roles";

interface UserRow {
  id: string;
  name: string;
  email: string;
  country: string;
  university: string;
  role: string;
  created_at: string;
}

interface Dormitory {
  id: string;
  name: string;
  address: string;
  total_rooms: number;
  available_rooms: number;
  price_per_month: number;
  description: string;
}

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
}

interface MedicalService {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  working_hours: string;
  description: string;
  is_free: boolean;
}

interface Guide {
  id: string;
  title: string;
  category: string;
  content: string;
}

interface PageContent {
  key: string;
  title: string;
  body: string;
  updated_at: string;
}

interface DormApplication {
  id: string;
  user_id: string;
  dormitory_id: string;
  dormitory_name: string;
  user_name: string;
  user_email: string;
  user_country: string;
  status: string;
  message: string;
  created_at: string;
}

interface PsychologyRequest {
  id: string;
  user_id: string;
  topic: string;
  message: string;
  preferred_date: string;
  status: string;
  created_at: string;
}

type TabKey =
  | "users"
  | "content"
  | "dormitories"
  | "jobs"
  | "medical"
  | "guides"
  | "psychology";

interface TabDef {
  key: TabKey;
  label: string;
  icon: string;
  visible: (role?: string | null) => boolean;
}

const TABS: TabDef[] = [
  { key: "users", label: "Users", icon: "👥", visible: canManageUsers },
  {
    key: "content",
    label: "Page Content",
    icon: "📝",
    visible: canManageContent,
  },
  {
    key: "dormitories",
    label: "Dormitories",
    icon: "🏠",
    visible: canManageDorms,
  },
  { key: "jobs", label: "Jobs", icon: "💼", visible: canManageJobs },
  { key: "medical", label: "Medical", icon: "🩺", visible: canManageMedical },
  { key: "guides", label: "Guides", icon: "📘", visible: canManageGuides },
  {
    key: "psychology",
    label: "Psychology",
    icon: "💬",
    visible: canManagePsychology,
  },
];

export default function Admin() {
  const user = useAuthStore((s) => s.user);
  const visibleTabs = TABS.filter((t) => t.visible(user?.role));
  const [active, setActive] = useState<TabKey>(
    visibleTabs[0]?.key || "users"
  );

  if (!canAccessAdmin(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />

      <main className="flex-1">
        <section className="bg-navy text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <span className="inline-block text-primary text-xs font-bold uppercase tracking-widest mb-2">
              Admin panel
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold">
              Site administration
            </h1>
            <p className="text-gray-300 mt-2 max-w-2xl">
              Manage users, page content, and the services available to
              students. You see only the sections your role can manage.
            </p>
          </div>
        </section>

        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActive(tab.key)}
                  className={`tab-button ${
                    active === tab.key
                      ? "tab-button-active"
                      : "tab-button-inactive"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            {active === "users" && <UsersTab />}
            {active === "content" && <ContentTab />}
            {active === "dormitories" && <DormitoriesTab />}
            {active === "jobs" && <JobsTab />}
            {active === "medical" && <MedicalTab />}
            {active === "guides" && <GuidesTab />}
            {active === "psychology" && <PsychologyTab />}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ─────────────────── Users tab ─────────────────── */

function UsersTab() {
  const qc = useQueryClient();
  const toast = useToast();

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => apiGet<UserRow[]>("/api/admin/users"),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiPut<UserRow>(`/api/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => apiDelete<{ id: string }>(`/api/admin/users/${id}`),
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (usersQuery.isLoading) return <LoadingSpinner label="Loading users..." />;
  if (usersQuery.isError)
    return (
      <ErrorBanner message={(usersQuery.error as Error).message} />
    );

  const users = usersQuery.data || [];

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-bg-light text-text-dark">
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>University</Th>
              <Th>Role</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <Td className="font-semibold text-navy">{u.name}</Td>
                <Td>{u.email}</Td>
                <Td>{u.university || "—"}</Td>
                <Td>
                  <select
                    value={u.role}
                    onChange={(e) =>
                      updateRole.mutate({ id: u.id, role: e.target.value })
                    }
                    className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                  >
                    {Object.values(ROLES).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Permanently delete ${u.name}? This cannot be undone.`
                        )
                      ) {
                        deleteUser.mutate(u.id);
                      }
                    }}
                    className="btn-danger"
                  >
                    Delete
                  </button>
                </Td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-8">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────── Page Content tab ─────────────────── */

function ContentTab() {
  const qc = useQueryClient();
  const toast = useToast();

  const contentQuery = useQuery({
    queryKey: ["admin", "page-content"],
    queryFn: () => apiGet<PageContent[]>("/api/page-content"),
  });

  const update = useMutation({
    mutationFn: (c: PageContent) =>
      apiPut<PageContent>(`/api/admin/page-content/${c.key}`, {
        title: c.title,
        body: c.body,
      }),
    onSuccess: () => {
      toast.success("Content saved");
      qc.invalidateQueries({ queryKey: ["admin", "page-content"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (contentQuery.isLoading)
    return <LoadingSpinner label="Loading content..." />;
  if (contentQuery.isError)
    return <ErrorBanner message={(contentQuery.error as Error).message} />;

  const items = contentQuery.data || [];

  return (
    <div className="space-y-5">
      {items.map((item) => (
        <ContentEditor key={item.key} item={item} onSave={update.mutate} />
      ))}
      {items.length === 0 && (
        <EmptyState message="No editable page content yet." />
      )}
    </div>
  );
}

function ContentEditor({
  item,
  onSave,
}: {
  item: PageContent;
  onSave: (c: PageContent) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body);

  return (
    <div className="card p-6">
      <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">
        {item.key}
      </div>
      <input
        className="input-field mb-3"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />
      <textarea
        className="input-field min-h-[120px]"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Body"
      />
      <div className="flex justify-end mt-3">
        <button
          onClick={() => onSave({ ...item, title, body })}
          className="btn-primary"
        >
          Save
        </button>
      </div>
    </div>
  );
}

/* ─────────────────── Dormitories tab ─────────────────── */

const emptyDorm: Omit<Dormitory, "id"> = {
  name: "",
  address: "",
  total_rooms: 0,
  available_rooms: 0,
  price_per_month: 0,
  description: "",
};

function DormitoriesTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<Dormitory | null>(null);
  const [creating, setCreating] = useState(false);
  const [subView, setSubView] = useState<"list" | "applications">("list");

  const query = useQuery({
    queryKey: ["admin", "dormitories"],
    queryFn: () => apiGet<Dormitory[]>("/api/dormitory"),
  });

  const appsQuery = useQuery({
    queryKey: ["admin", "dorm-applications"],
    queryFn: () => apiGet<DormApplication[]>("/api/admin/dormitory-applications"),
  });

  const updateAppStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiPut<DormApplication>(`/api/admin/dormitory-applications/${id}`, { status }),
    onSuccess: () => {
      toast.success("Application status updated");
      qc.invalidateQueries({ queryKey: ["admin", "dorm-applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: (body: Omit<Dormitory, "id">) =>
      apiPost<Dormitory>("/api/admin/dormitories", body),
    onSuccess: () => {
      toast.success("Dormitory created");
      qc.invalidateQueries({ queryKey: ["admin", "dormitories"] });
      setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (d: Dormitory) =>
      apiPut<Dormitory>(`/api/admin/dormitories/${d.id}`, d),
    onSuccess: () => {
      toast.success("Dormitory updated");
      qc.invalidateQueries({ queryKey: ["admin", "dormitories"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ id: string }>(`/api/admin/dormitories/${id}`),
    onSuccess: () => {
      toast.success("Dormitory deleted");
      qc.invalidateQueries({ queryKey: ["admin", "dormitories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apps = appsQuery.data || [];
  const pendingCount = apps.filter((a) => a.status === "pending").length;
  const approvedCount = apps.filter((a) => a.status === "approved").length;

  return (
    <>
      {/* Sub-navigation */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setSubView("list")}
          className={`tab-button ${subView === "list" ? "tab-button-active" : "tab-button-inactive"}`}
        >
          Dormitories
        </button>
        <button
          onClick={() => setSubView("applications")}
          className={`tab-button ${subView === "applications" ? "tab-button-active" : "tab-button-inactive"}`}
        >
          Applications
          {pendingCount > 0 && (
            <span className="ml-1.5 bg-yellow-100 text-yellow-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <div className="flex-1" />
        {subView === "list" && (
          <button onClick={() => setCreating(true)} className="btn-primary">
            + Add dormitory
          </button>
        )}
      </div>

      {/* Stats banner */}
      {subView === "applications" && apps.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded border border-gray-200 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-navy">{apps.length}</div>
            <div className="text-xs text-muted uppercase tracking-wider">Total</div>
          </div>
          <div className="bg-white rounded border border-gray-200 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-xs text-muted uppercase tracking-wider">Pending</div>
          </div>
          <div className="bg-white rounded border border-gray-200 px-4 py-3 text-center">
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <div className="text-xs text-muted uppercase tracking-wider">Approved</div>
          </div>
        </div>
      )}

      {subView === "list" ? (
        <>
          {query.isLoading ? (
            <LoadingSpinner label="Loading dormitories..." />
          ) : query.isError ? (
            <ErrorBanner message={(query.error as Error).message} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(query.data || []).map((d) => (
                <div key={d.id} className="card p-5">
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div>
                      <h3 className="font-bold text-navy text-lg">{d.name}</h3>
                      <div className="text-xs text-muted">{d.address}</div>
                    </div>
                    <span className="badge-green">
                      {d.available_rooms}/{d.total_rooms}
                    </span>
                  </div>
                  <p className="text-sm text-muted line-clamp-2 mb-3">
                    {d.description}
                  </p>
                  <div className="text-sm font-semibold text-text-dark mb-3">
                    ₸ {d.price_per_month.toLocaleString()} / month
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(d)}
                      className="btn-ghost flex-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${d.name}?`)) remove.mutate(d.id);
                      }}
                      className="btn-danger flex-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {(query.data || []).length === 0 && (
                <EmptyState message="No dormitories yet." />
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {appsQuery.isLoading ? (
            <LoadingSpinner label="Loading applications..." />
          ) : appsQuery.isError ? (
            <ErrorBanner message={(appsQuery.error as Error).message} />
          ) : apps.length === 0 ? (
            <EmptyState message="No dormitory applications yet." />
          ) : (
            <div className="space-y-3">
              {apps.map((a) => (
                <div key={a.id} className="card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-bold text-navy">{a.user_name}</h4>
                      <div className="text-xs text-muted">
                        {a.user_email} · {a.user_country || "—"}
                      </div>
                      <div className="text-xs text-text-dark mt-1">
                        Applied to: <strong>{a.dormitory_name}</strong>
                      </div>
                      <div className="text-xs text-muted">
                        {new Date(a.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <select
                      value={a.status}
                      onChange={(e) =>
                        updateAppStatus.mutate({ id: a.id, status: e.target.value })
                      }
                      className="border border-gray-300 rounded px-2 py-1 text-sm bg-white self-start"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  {a.message && (
                    <pre className="text-xs text-muted whitespace-pre-wrap font-sans bg-bg-light rounded p-3 mt-2">
                      {a.message}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {creating && (
        <DormitoryModal
          initial={emptyDorm}
          title="New dormitory"
          onClose={() => setCreating(false)}
          onSave={(b) => create.mutate(b)}
        />
      )}
      {editing && (
        <DormitoryModal
          initial={editing}
          title="Edit dormitory"
          onClose={() => setEditing(null)}
          onSave={(b) => update.mutate({ ...editing, ...b })}
        />
      )}
    </>
  );
}

function DormitoryModal({
  initial,
  title,
  onClose,
  onSave,
}: {
  initial: Omit<Dormitory, "id">;
  title: string;
  onClose: () => void;
  onSave: (d: Omit<Dormitory, "id">) => void;
}) {
  const [form, setForm] = useState(initial);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Input
          label="Name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
        />
        <Input
          label="Address"
          value={form.address}
          onChange={(v) => setForm({ ...form, address: v })}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Total rooms"
            type="number"
            value={String(form.total_rooms)}
            onChange={(v) => setForm({ ...form, total_rooms: Number(v) })}
          />
          <Input
            label="Available"
            type="number"
            value={String(form.available_rooms)}
            onChange={(v) => setForm({ ...form, available_rooms: Number(v) })}
          />
        </div>
        <Input
          label="Price per month (₸)"
          type="number"
          value={String(form.price_per_month)}
          onChange={(v) => setForm({ ...form, price_per_month: Number(v) })}
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />
        <ModalActions onClose={onClose} />
      </form>
    </Modal>
  );
}

/* ─────────────────── Jobs tab ─────────────────── */

const emptyJob: Omit<Job, "id"> = {
  title: "",
  company: "",
  description: "",
  salary: "",
  schedule: "",
  location: "",
  requirements: "",
  contact_email: "",
};

function JobsTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<Job | null>(null);
  const [creating, setCreating] = useState(false);

  const query = useQuery({
    queryKey: ["admin", "jobs"],
    queryFn: () => apiGet<Job[]>("/api/jobs"),
  });

  const create = useMutation({
    mutationFn: (b: Omit<Job, "id">) => apiPost<Job>("/api/admin/jobs", b),
    onSuccess: () => {
      toast.success("Job created");
      qc.invalidateQueries({ queryKey: ["admin", "jobs"] });
      setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (j: Job) => apiPut<Job>(`/api/admin/jobs/${j.id}`, j),
    onSuccess: () => {
      toast.success("Job updated");
      qc.invalidateQueries({ queryKey: ["admin", "jobs"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ id: string }>(`/api/admin/jobs/${id}`),
    onSuccess: () => {
      toast.success("Job deleted");
      qc.invalidateQueries({ queryKey: ["admin", "jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (query.isLoading) return <LoadingSpinner label="Loading jobs..." />;
  if (query.isError)
    return <ErrorBanner message={(query.error as Error).message} />;

  const items = query.data || [];

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setCreating(true)} className="btn-primary">
          + Add job
        </button>
      </div>

      <div className="space-y-3">
        {items.map((j) => (
          <div key={j.id} className="card p-5 flex justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-navy">{j.title}</h3>
              <div className="text-sm text-muted">
                {j.company} · {j.location} · {j.schedule}
              </div>
              <div className="text-sm text-text-dark mt-1">{j.salary}</div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setEditing(j)} className="btn-ghost">
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${j.title}?`)) remove.mutate(j.id);
                }}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState message="No jobs yet." />}
      </div>

      {creating && (
        <JobModal
          initial={emptyJob}
          title="New job"
          onClose={() => setCreating(false)}
          onSave={(b) => create.mutate(b)}
        />
      )}
      {editing && (
        <JobModal
          initial={editing}
          title="Edit job"
          onClose={() => setEditing(null)}
          onSave={(b) => update.mutate({ ...editing, ...b })}
        />
      )}
    </>
  );
}

function JobModal({
  initial,
  title,
  onClose,
  onSave,
}: {
  initial: Omit<Job, "id">;
  title: string;
  onClose: () => void;
  onSave: (d: Omit<Job, "id">) => void;
}) {
  const [form, setForm] = useState(initial);
  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="space-y-3"
      >
        <Input
          label="Title"
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
          required
        />
        <Input
          label="Company"
          value={form.company}
          onChange={(v) => setForm({ ...form, company: v })}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Location"
            value={form.location}
            onChange={(v) => setForm({ ...form, location: v })}
          />
          <Input
            label="Schedule"
            value={form.schedule}
            onChange={(v) => setForm({ ...form, schedule: v })}
          />
        </div>
        <Input
          label="Salary"
          value={form.salary}
          onChange={(v) => setForm({ ...form, salary: v })}
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />
        <Textarea
          label="Requirements"
          value={form.requirements}
          onChange={(v) => setForm({ ...form, requirements: v })}
        />
        <Input
          label="Contact email"
          type="email"
          value={form.contact_email}
          onChange={(v) => setForm({ ...form, contact_email: v })}
        />
        <ModalActions onClose={onClose} />
      </form>
    </Modal>
  );
}

/* ─────────────────── Medical tab ─────────────────── */

const emptyMedical: Omit<MedicalService, "id"> = {
  name: "",
  type: "",
  address: "",
  phone: "",
  working_hours: "",
  description: "",
  is_free: false,
};

function MedicalTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<MedicalService | null>(null);
  const [creating, setCreating] = useState(false);

  const query = useQuery({
    queryKey: ["admin", "medical"],
    queryFn: () => apiGet<MedicalService[]>("/api/medical"),
  });

  const create = useMutation({
    mutationFn: (b: Omit<MedicalService, "id">) =>
      apiPost<MedicalService>("/api/admin/medical", b),
    onSuccess: () => {
      toast.success("Service created");
      qc.invalidateQueries({ queryKey: ["admin", "medical"] });
      setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (m: MedicalService) =>
      apiPut<MedicalService>(`/api/admin/medical/${m.id}`, m),
    onSuccess: () => {
      toast.success("Service updated");
      qc.invalidateQueries({ queryKey: ["admin", "medical"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ id: string }>(`/api/admin/medical/${id}`),
    onSuccess: () => {
      toast.success("Service deleted");
      qc.invalidateQueries({ queryKey: ["admin", "medical"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (query.isLoading)
    return <LoadingSpinner label="Loading services..." />;
  if (query.isError)
    return <ErrorBanner message={(query.error as Error).message} />;

  const items = query.data || [];

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setCreating(true)} className="btn-primary">
          + Add service
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((m) => (
          <div key={m.id} className="card p-5">
            <div className="flex justify-between items-start gap-3 mb-2">
              <div>
                <h3 className="font-bold text-navy">{m.name}</h3>
                <div className="text-xs text-muted">{m.type}</div>
              </div>
              {m.is_free && <span className="badge-green">Free</span>}
            </div>
            <div className="text-sm text-text-dark space-y-0.5">
              <div>{m.address}</div>
              <div>{m.phone}</div>
              <div className="text-muted">{m.working_hours}</div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setEditing(m)}
                className="btn-ghost flex-1"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${m.name}?`)) remove.mutate(m.id);
                }}
                className="btn-danger flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState message="No services yet." />}
      </div>

      {creating && (
        <MedicalModal
          initial={emptyMedical}
          title="New medical service"
          onClose={() => setCreating(false)}
          onSave={(b) => create.mutate(b)}
        />
      )}
      {editing && (
        <MedicalModal
          initial={editing}
          title="Edit medical service"
          onClose={() => setEditing(null)}
          onSave={(b) => update.mutate({ ...editing, ...b })}
        />
      )}
    </>
  );
}

function MedicalModal({
  initial,
  title,
  onClose,
  onSave,
}: {
  initial: Omit<MedicalService, "id">;
  title: string;
  onClose: () => void;
  onSave: (d: Omit<MedicalService, "id">) => void;
}) {
  const [form, setForm] = useState(initial);
  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="space-y-3"
      >
        <Input
          label="Name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
        />
        <Input
          label="Type"
          value={form.type}
          onChange={(v) => setForm({ ...form, type: v })}
          placeholder="e.g. clinic, pharmacy"
        />
        <Input
          label="Address"
          value={form.address}
          onChange={(v) => setForm({ ...form, address: v })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
          />
          <Input
            label="Working hours"
            value={form.working_hours}
            onChange={(v) => setForm({ ...form, working_hours: v })}
          />
        </div>
        <Textarea
          label="Description"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_free}
            onChange={(e) => setForm({ ...form, is_free: e.target.checked })}
          />
          Free for students
        </label>
        <ModalActions onClose={onClose} />
      </form>
    </Modal>
  );
}

/* ─────────────────── Guides tab ─────────────────── */

const emptyGuide: Omit<Guide, "id"> = {
  title: "",
  category: "",
  content: "",
};

function GuidesTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<Guide | null>(null);
  const [creating, setCreating] = useState(false);

  const query = useQuery({
    queryKey: ["admin", "guides"],
    queryFn: () => apiGet<Guide[]>("/api/guides"),
  });

  const create = useMutation({
    mutationFn: (b: Omit<Guide, "id">) =>
      apiPost<Guide>("/api/admin/guides", b),
    onSuccess: () => {
      toast.success("Guide created");
      qc.invalidateQueries({ queryKey: ["admin", "guides"] });
      setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (g: Guide) => apiPut<Guide>(`/api/admin/guides/${g.id}`, g),
    onSuccess: () => {
      toast.success("Guide updated");
      qc.invalidateQueries({ queryKey: ["admin", "guides"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ id: string }>(`/api/admin/guides/${id}`),
    onSuccess: () => {
      toast.success("Guide deleted");
      qc.invalidateQueries({ queryKey: ["admin", "guides"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (query.isLoading) return <LoadingSpinner label="Loading guides..." />;
  if (query.isError)
    return <ErrorBanner message={(query.error as Error).message} />;

  const items = query.data || [];

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setCreating(true)} className="btn-primary">
          + Add guide
        </button>
      </div>
      <div className="space-y-3">
        {items.map((g) => (
          <div key={g.id} className="card p-5">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <span className="badge-yellow">{g.category}</span>
                <h3 className="font-bold text-navy mt-2">{g.title}</h3>
                <p className="text-sm text-muted line-clamp-2 mt-1">
                  {g.content}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setEditing(g)} className="btn-ghost">
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete ${g.title}?`)) remove.mutate(g.id);
                  }}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState message="No guides yet." />}
      </div>

      {creating && (
        <GuideModal
          initial={emptyGuide}
          title="New guide"
          onClose={() => setCreating(false)}
          onSave={(b) => create.mutate(b)}
        />
      )}
      {editing && (
        <GuideModal
          initial={editing}
          title="Edit guide"
          onClose={() => setEditing(null)}
          onSave={(b) => update.mutate({ ...editing, ...b })}
        />
      )}
    </>
  );
}

function GuideModal({
  initial,
  title,
  onClose,
  onSave,
}: {
  initial: Omit<Guide, "id">;
  title: string;
  onClose: () => void;
  onSave: (d: Omit<Guide, "id">) => void;
}) {
  const [form, setForm] = useState(initial);
  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="space-y-3"
      >
        <Input
          label="Title"
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
          required
        />
        <Input
          label="Category"
          value={form.category}
          onChange={(v) => setForm({ ...form, category: v })}
          placeholder="e.g. Transport, Banking"
        />
        <Textarea
          label="Content"
          value={form.content}
          onChange={(v) => setForm({ ...form, content: v })}
          rows={10}
        />
        <ModalActions onClose={onClose} />
      </form>
    </Modal>
  );
}

/* ─────────────────── Psychology tab ─────────────────── */

function PsychologyTab() {
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: ["admin", "psychology"],
    queryFn: () =>
      apiGet<PsychologyRequest[]>("/api/admin/psychology-requests"),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiPut<PsychologyRequest>(`/api/admin/psychology-requests/${id}`, {
        status,
      }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin", "psychology"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (query.isLoading) return <LoadingSpinner label="Loading requests..." />;
  if (query.isError)
    return <ErrorBanner message={(query.error as Error).message} />;

  const items = query.data || [];

  return (
    <div className="space-y-3">
      {items.map((r) => (
        <div key={r.id} className="card p-5">
          <div className="flex justify-between items-start gap-3 mb-2">
            <div>
              <h3 className="font-bold text-navy">{r.topic}</h3>
              <div className="text-xs text-muted">
                Preferred: {r.preferred_date || "—"}
              </div>
            </div>
            <select
              value={r.status}
              onChange={(e) =>
                update.mutate({ id: r.id, status: e.target.value })
              }
              className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
            >
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <p className="text-sm text-text-dark whitespace-pre-wrap">
            {r.message}
          </p>
        </div>
      ))}
      {items.length === 0 && <EmptyState message="No psychology requests." />}
    </div>
  );
}

/* ─────────────────── Helpers ─────────────────── */

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider font-bold">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3">
      {message}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center text-muted py-12 bg-white rounded-md border border-dashed border-gray-200">
      {message}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h3 className="font-bold text-navy text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-text-dark text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex gap-2 pt-3">
      <button type="button" onClick={onClose} className="btn-secondary flex-1">
        Cancel
      </button>
      <button type="submit" className="btn-primary flex-1">
        Save
      </button>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-dark mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-dark mb-1">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      />
    </div>
  );
}
