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
  single_rooms: number;
  double_rooms: number;
  price_per_month: number;
  description: string;
  image_url: string;
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
  image_url: string;
}

interface Guide {
  id: string;
  title: string;
  category: string;
  content: string;
  image_url: string;
}

interface PageContent {
  key: string;
  title: string;
  body: string;
  image_url: string;
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
  room_type: string;
  status: string;
  message: string;
  created_at: string;
}

interface JobApplicationDetail {
  id: string;
  user_id: string;
  job_id: string;
  job_title: string;
  company: string;
  user_name: string;
  user_email: string;
  status: string;
  created_at: string;
}

interface MedicalAppointmentDetail {
  id: string;
  user_id: string;
  service_id: string;
  service_name: string;
  user_name: string;
  user_email: string;
  date: string;
  time: string;
  status: string;
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
  | "psychology"
  | "tasks";

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
  {
    key: "tasks",
    label: "Tasks",
    icon: "🎯",
    visible: (role) => role === "admin",
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
            {active === "tasks" && <TasksTab />}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ─────────────────── Users tab ─────────────────── */

interface NewUserForm {
  name: string;
  email: string;
  password: string;
  country: string;
  university: string;
  role: string;
}

const emptyUser: NewUserForm = {
  name: "",
  email: "",
  password: "",
  country: "Kazakhstan",
  university: "Narxoz University",
  role: "student",
};

function UsersTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const [creating, setCreating] = useState(false);

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => apiGet<UserRow[]>("/api/admin/users"),
  });

  const createUser = useMutation({
    mutationFn: (body: NewUserForm) => apiPost<UserRow>("/api/admin/users", body),
    onSuccess: () => {
      toast.success("User created");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
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
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setCreating(true)} className="btn-primary">
          + Add user
        </button>
      </div>

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

      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onSave={(b) => createUser.mutate(b)}
          saving={createUser.isPending}
        />
      )}
    </>
  );
}

function CreateUserModal({
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void;
  onSave: (u: NewUserForm) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<NewUserForm>(emptyUser);

  return (
    <Modal title="Create new user" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="space-y-3"
      >
        <Input
          label="Full name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          required
        />
        <Input
          label="Temporary password"
          type="password"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
          required
          placeholder="Min 6 characters"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Country"
            value={form.country}
            onChange={(v) => setForm({ ...form, country: v })}
          />
          <Input
            label="University"
            value={form.university}
            onChange={(v) => setForm({ ...form, university: v })}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-dark mb-1">
            Role
          </label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="input-field"
          >
            {Object.values(ROLES).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create user"}
          </button>
        </div>
      </form>
    </Modal>
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
        image_url: c.image_url,
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
  const [imageUrl, setImageUrl] = useState(item.image_url || "");

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
        className="input-field min-h-[120px] mb-3"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Body"
      />
      <input
        className="input-field"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Image URL (https://...)"
      />
      {imageUrl && (
        <div className="mt-3">
          <img
            src={imageUrl}
            alt="preview"
            className="h-32 rounded border border-gray-200 object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>
      )}
      <div className="flex justify-end mt-3">
        <button
          onClick={() => onSave({ ...item, title, body, image_url: imageUrl })}
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
  single_rooms: 0,
  double_rooms: 0,
  price_per_month: 0,
  description: "",
  image_url: "",
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
                <div key={d.id} className="card overflow-hidden">
                  {d.image_url ? (
                    <img
                      src={d.image_url}
                      alt={d.name}
                      className="w-full h-40 object-cover"
                      onError={(e) =>
                        (e.currentTarget.style.display = "none")
                      }
                    />
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-navy to-primary" />
                  )}
                  <div className="p-5">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-navy text-lg">{d.name}</h3>
                        <button
                          onClick={() => window.open(`https://2gis.kz/search/${encodeURIComponent(d.address)}`, "_blank", "noopener,noreferrer")}
                          className="text-xs text-primary hover:underline"
                          title="Open on map"
                        >
                          {d.address}
                        </button>
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
                  {a.room_type && a.room_type !== "any" && (
                    <div className="text-xs text-text-dark mt-1">
                      Room type: <strong className="capitalize">{a.room_type}</strong>
                    </div>
                  )}
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
          <NumberInput
            label="Total rooms"
            value={form.total_rooms}
            onChange={(v) => setForm({ ...form, total_rooms: v })}
          />
          <NumberInput
            label="Available"
            value={form.available_rooms}
            onChange={(v) => setForm({ ...form, available_rooms: v })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="Single rooms available"
            value={form.single_rooms}
            onChange={(v) => setForm({ ...form, single_rooms: v })}
          />
          <NumberInput
            label="Double rooms available"
            value={form.double_rooms}
            onChange={(v) => setForm({ ...form, double_rooms: v })}
          />
        </div>
        <NumberInput
          label="Price per month (₸)"
          value={form.price_per_month}
          onChange={(v) => setForm({ ...form, price_per_month: v })}
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />
        <ImageUrlField
          value={form.image_url}
          onChange={(v) => setForm({ ...form, image_url: v })}
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
  const [subView, setSubView] = useState<"list" | "applications">("list");

  const query = useQuery({
    queryKey: ["admin", "jobs"],
    queryFn: () => apiGet<Job[]>("/api/jobs"),
  });

  const appsQuery = useQuery({
    queryKey: ["admin", "job-applications"],
    queryFn: () => apiGet<JobApplicationDetail[]>("/api/admin/job-applications"),
  });

  const updateAppStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiPut<JobApplicationDetail>(`/api/admin/job-applications/${id}`, { status }),
    onSuccess: () => {
      toast.success("Application status updated");
      qc.invalidateQueries({ queryKey: ["admin", "job-applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
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

  const apps = appsQuery.data || [];
  const pendingCount = apps.filter((a) => a.status === "pending").length;

  return (
    <>
      {/* Sub-navigation */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setSubView("list")}
          className={`tab-button ${subView === "list" ? "tab-button-active" : "tab-button-inactive"}`}
        >
          Jobs
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
            + Add job
          </button>
        )}
      </div>

      {subView === "list" ? (
        <>
          {query.isLoading ? (
            <LoadingSpinner label="Loading jobs..." />
          ) : query.isError ? (
            <ErrorBanner message={(query.error as Error).message} />
          ) : (
            <div className="space-y-3">
              {(query.data || []).map((j) => (
                <div key={j.id} className="card p-5 flex justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-navy">{j.title}</h3>
                    <div className="text-sm text-muted">
                      {j.company} · {j.location} · {j.schedule}
                    </div>
                    <div className="text-sm text-text-dark mt-1">{j.salary}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setEditing(j)} className="btn-ghost">Edit</button>
                    <button
                      onClick={() => { if (confirm(`Delete ${j.title}?`)) remove.mutate(j.id); }}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {(query.data || []).length === 0 && <EmptyState message="No jobs yet." />}
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
            <EmptyState message="No job applications yet." />
          ) : (
            <div className="space-y-3">
              {apps.map((a) => (
                <div key={a.id} className="card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-bold text-navy">{a.user_name}</h4>
                      <div className="text-xs text-muted">{a.user_email}</div>
                      <div className="text-xs text-text-dark mt-1">
                        Applied for: <strong>{a.job_title}</strong> at {a.company}
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
                      onChange={(e) => updateAppStatus.mutate({ id: a.id, status: e.target.value })}
                      className="border border-gray-300 rounded px-2 py-1 text-sm bg-white self-start"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

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
  image_url: "",
};

function MedicalTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<MedicalService | null>(null);
  const [creating, setCreating] = useState(false);
  const [subView, setSubView] = useState<"list" | "appointments">("list");

  const query = useQuery({
    queryKey: ["admin", "medical"],
    queryFn: () => apiGet<MedicalService[]>("/api/medical"),
  });

  const appsQuery = useQuery({
    queryKey: ["admin", "medical-appointments"],
    queryFn: () => apiGet<MedicalAppointmentDetail[]>("/api/admin/medical-appointments"),
  });

  const updateAppStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiPut<MedicalAppointmentDetail>(`/api/admin/medical-appointments/${id}`, { status }),
    onSuccess: () => {
      toast.success("Appointment status updated");
      qc.invalidateQueries({ queryKey: ["admin", "medical-appointments"] });
    },
    onError: (e: Error) => toast.error(e.message),
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

  const appointments = appsQuery.data || [];
  const pendingCount = appointments.filter((a) => a.status === "pending").length;

  return (
    <>
      {/* Sub-navigation */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setSubView("list")}
          className={`tab-button ${subView === "list" ? "tab-button-active" : "tab-button-inactive"}`}
        >
          Services
        </button>
        <button
          onClick={() => setSubView("appointments")}
          className={`tab-button ${subView === "appointments" ? "tab-button-active" : "tab-button-inactive"}`}
        >
          Appointments
          {pendingCount > 0 && (
            <span className="ml-1.5 bg-yellow-100 text-yellow-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <div className="flex-1" />
        {subView === "list" && (
          <button onClick={() => setCreating(true)} className="btn-primary">
            + Add service
          </button>
        )}
      </div>

      {subView === "list" ? (
        <>
          {query.isLoading ? (
            <LoadingSpinner label="Loading services..." />
          ) : query.isError ? (
            <ErrorBanner message={(query.error as Error).message} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(query.data || []).map((m) => (
                <div key={m.id} className="card overflow-hidden">
                  {m.image_url ? (
                    <img
                      src={m.image_url}
                      alt={m.name}
                      className="w-full h-36 object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : null}
                  <div className="p-5">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-navy">{m.name}</h3>
                        <div className="text-xs text-muted">{m.type}</div>
                      </div>
                      {m.is_free && <span className="badge-green">Free</span>}
                    </div>
                    <div className="text-sm text-text-dark space-y-0.5">
                      <button
                        onClick={() => window.open(`https://2gis.kz/search/${encodeURIComponent(m.address)}`, "_blank", "noopener,noreferrer")}
                        className="text-primary hover:underline text-left"
                        title="Open on map"
                      >
                        {m.address}
                      </button>
                      <div>{m.phone}</div>
                      <div className="text-muted">{m.working_hours}</div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setEditing(m)} className="btn-ghost flex-1">Edit</button>
                      <button
                        onClick={() => { if (confirm(`Delete ${m.name}?`)) remove.mutate(m.id); }}
                        className="btn-danger flex-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {(query.data || []).length === 0 && <EmptyState message="No services yet." />}
            </div>
          )}
        </>
      ) : (
        <>
          {appsQuery.isLoading ? (
            <LoadingSpinner label="Loading appointments..." />
          ) : appsQuery.isError ? (
            <ErrorBanner message={(appsQuery.error as Error).message} />
          ) : appointments.length === 0 ? (
            <EmptyState message="No appointments yet." />
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => (
                <div key={a.id} className="card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-navy">{a.user_name}</h4>
                      <div className="text-xs text-muted">{a.user_email}</div>
                      <div className="text-xs text-text-dark mt-1">
                        Service: <strong>{a.service_name}</strong>
                      </div>
                      <div className="text-xs text-muted">
                        {a.date} {a.time && `at ${a.time}`}
                      </div>
                    </div>
                    <select
                      value={a.status}
                      onChange={(e) => updateAppStatus.mutate({ id: a.id, status: e.target.value })}
                      className="border border-gray-300 rounded px-2 py-1 text-sm bg-white self-start"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

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
        <ImageUrlField
          value={form.image_url}
          onChange={(v) => setForm({ ...form, image_url: v })}
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
  image_url: "",
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
            <div className="flex justify-between items-start gap-4">
              {g.image_url && (
                <img
                  src={g.image_url}
                  alt={g.title}
                  className="w-24 h-24 object-cover rounded flex-shrink-0"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
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
        <div>
          <label className="block text-xs font-semibold text-text-dark mb-1">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="input-field"
            required
          >
            <option value="">— Select category —</option>
            <option value="transport">Transport</option>
            <option value="banking">Banking</option>
            <option value="mobile">Mobile</option>
            <option value="food">Food</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
        <Textarea
          label="Content"
          value={form.content}
          onChange={(v) => setForm({ ...form, content: v })}
          rows={10}
        />
        <ImageUrlField
          value={form.image_url}
          onChange={(v) => setForm({ ...form, image_url: v })}
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
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
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

/* ─────────────────── Tasks tab ─────────────────── */

interface TaskItem {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  deadline: string;
  status: string;
  created_by: string;
  created_at: string;
}

interface TeamTaskAssignmentItem {
  id: string;
  team_id: string;
  task_id: string;
  status: string;
  assigned_at: string;
  completed_at: string;
  title: string;
  description: string;
  xp_reward: number;
  team_name: string;
  submission_text: string;
}

interface TeamSummaryItem {
  id: string;
  name: string;
  language: string;
  language_level: string;
}

function TasksTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const [subView, setSubView] = useState<"tasks" | "assignments">("tasks");
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [assigningTask, setAssigningTask] = useState<TaskItem | null>(null);

  const tasksQuery = useQuery({
    queryKey: ["admin", "tasks"],
    queryFn: () => apiGet<TaskItem[]>("/api/admin/tasks"),
  });

  const assignmentsQuery = useQuery({
    queryKey: ["admin", "team-tasks"],
    queryFn: () => apiGet<TeamTaskAssignmentItem[]>("/api/admin/team-tasks"),
  });

  const createTask = useMutation({
    mutationFn: (body: Omit<TaskItem, "id" | "created_by" | "created_at">) =>
      apiPost<TaskItem>("/api/admin/tasks", body),
    onSuccess: () => {
      toast.success("Task created");
      qc.invalidateQueries({ queryKey: ["admin", "tasks"] });
      setCreatingTask(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateTask = useMutation({
    mutationFn: (t: TaskItem) => apiPut<TaskItem>(`/api/admin/tasks/${t.id}`, t),
    onSuccess: () => {
      toast.success("Task updated");
      qc.invalidateQueries({ queryKey: ["admin", "tasks"] });
      setEditingTask(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => apiDelete<{ status: string }>(`/api/admin/tasks/${id}`),
    onSuccess: () => {
      toast.success("Task deleted");
      qc.invalidateQueries({ queryKey: ["admin", "tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiPut<{ status: string }>(`/api/admin/team-tasks/${id}`, { status: "completed" }),
    onSuccess: () => {
      toast.success("Task approved — XP awarded!");
      qc.invalidateQueries({ queryKey: ["admin", "team-tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      apiPut<{ status: string }>(`/api/admin/team-tasks/${id}`, { status: "assigned" }),
    onSuccess: () => {
      toast.success("Submission rejected — team can resubmit.");
      qc.invalidateQueries({ queryKey: ["admin", "team-tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const tasks = tasksQuery.data || [];
  const assignments = assignmentsQuery.data || [];

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setSubView("tasks")}
          className={`tab-button ${subView === "tasks" ? "tab-button-active" : "tab-button-inactive"}`}
        >
          Tasks
        </button>
        <button
          onClick={() => setSubView("assignments")}
          className={`tab-button ${subView === "assignments" ? "tab-button-active" : "tab-button-inactive"}`}
        >
          Assignments
          {assignments.filter((a) => a.status === "submitted").length > 0 && (
            <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {assignments.filter((a) => a.status === "submitted").length} pending
            </span>
          )}
        </button>
        <div className="flex-1" />
        {subView === "tasks" && (
          <button onClick={() => setCreatingTask(true)} className="btn-primary">
            + Add task
          </button>
        )}
      </div>

      {subView === "tasks" ? (
        <>
          {tasksQuery.isLoading ? (
            <LoadingSpinner label="Loading tasks..." />
          ) : tasksQuery.isError ? (
            <ErrorBanner message={(tasksQuery.error as Error).message} />
          ) : (
            <div className="space-y-3">
              {tasks.map((t) => (
                <div key={t.id} className="card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-navy">{t.title}</h3>
                        <span className="text-yellow-600 font-bold text-xs bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded">
                          ⭐ {t.xp_reward} XP
                        </span>
                        {t.status === "archived" && (
                          <span className="badge-red">Archived</span>
                        )}
                      </div>
                      {t.description && (
                        <p className="text-sm text-muted line-clamp-2">{t.description}</p>
                      )}
                      {t.deadline && (
                        <p className="text-xs text-muted mt-1">
                          Deadline: {new Date(t.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setAssigningTask(t)}
                        className="btn-ghost text-sm"
                      >
                        Assign
                      </button>
                      <button onClick={() => setEditingTask(t)} className="btn-ghost">
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${t.title}"?`)) deleteTask.mutate(t.id);
                        }}
                        className="btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <EmptyState message="No tasks yet." />}
            </div>
          )}
        </>
      ) : (
        <>
          {assignmentsQuery.isLoading ? (
            <LoadingSpinner label="Loading assignments..." />
          ) : assignmentsQuery.isError ? (
            <ErrorBanner message={(assignmentsQuery.error as Error).message} />
          ) : assignments.length === 0 ? (
            <EmptyState message="No task assignments yet." />
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className={`card p-5 ${
                    a.status === "submitted"
                      ? "border-blue-300 bg-blue-50"
                      : a.status === "completed"
                      ? "border-green-200 bg-green-50"
                      : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-navy">{a.title}</span>
                        <span className="text-xs text-yellow-600 font-bold bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded">
                          ⭐ {a.xp_reward} XP
                        </span>
                        {a.status === "completed" ? (
                          <span className="badge-green">Completed</span>
                        ) : a.status === "submitted" ? (
                          <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-semibold">
                            Submitted — Awaiting Review
                          </span>
                        ) : (
                          <span className="badge-yellow">Assigned</span>
                        )}
                      </div>
                      <p className="text-sm text-muted">
                        Team: <span className="font-semibold text-text-dark">{a.team_name || "—"}</span>
                        <span className="mx-2 text-gray-300">|</span>
                        Assigned:{" "}
                        {a.assigned_at
                          ? new Date(a.assigned_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                        {a.completed_at && (
                          <>
                            <span className="mx-2 text-gray-300">|</span>
                            Completed:{" "}
                            {new Date(a.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </>
                        )}
                      </p>
                      {a.status === "submitted" && a.submission_text && (
                        <div className="mt-3 p-3 bg-white border border-blue-200 rounded text-sm text-text-dark">
                          <span className="text-xs font-semibold text-muted block mb-1">Team submission:</span>
                          <p className="whitespace-pre-wrap">{a.submission_text}</p>
                        </div>
                      )}
                    </div>
                    {a.status === "submitted" && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => rejectMutation.mutate(a.id)}
                          disabled={rejectMutation.isPending || approveMutation.isPending}
                          className="btn-danger text-sm disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => approveMutation.mutate(a.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          className="btn-primary text-sm disabled:opacity-50"
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {creatingTask && (
        <TaskModal
          title="New task"
          onClose={() => setCreatingTask(false)}
          onSave={(b) => createTask.mutate(b)}
          saving={createTask.isPending}
        />
      )}
      {editingTask && (
        <TaskModal
          title="Edit task"
          initial={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(b) => updateTask.mutate({ ...editingTask, ...b })}
          saving={updateTask.isPending}
        />
      )}
      {assigningTask && (
        <AssignModal
          task={assigningTask}
          onClose={() => setAssigningTask(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["admin", "team-tasks"] });
            setAssigningTask(null);
          }}
        />
      )}
    </>
  );
}

interface TaskFormValues {
  title: string;
  description: string;
  xp_reward: number;
  deadline: string;
  status: string;
}

function TaskModal({
  title,
  initial,
  onClose,
  onSave,
  saving,
}: {
  title: string;
  initial?: Partial<TaskFormValues>;
  onClose: () => void;
  onSave: (v: TaskFormValues) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<TaskFormValues>({
    title: initial?.title || "",
    description: initial?.description || "",
    xp_reward: initial?.xp_reward ?? 10,
    deadline: initial?.deadline ? initial.deadline.slice(0, 10) : "",
    status: initial?.status || "active",
  });

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
        <Textarea
          label="Description"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />
        <NumberInput
          label="XP Reward"
          value={form.xp_reward}
          onChange={(v) => setForm({ ...form, xp_reward: v })}
        />
        <div>
          <label className="block text-xs font-semibold text-text-dark mb-1">
            Deadline <span className="text-muted font-normal">(optional)</span>
          </label>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-dark mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="input-field"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="flex gap-2 pt-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssignModal({
  task,
  onClose,
  onSuccess,
}: {
  task: TaskItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const teamsQuery = useQuery({
    queryKey: ["teams"],
    queryFn: () => apiGet<TeamSummaryItem[]>("/api/teams"),
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      apiPost<TeamTaskAssignmentItem>(`/api/admin/tasks/${task.id}/assign`, { team_id: selectedTeamId }),
    onSuccess: () => {
      toast.success("Task assigned to team");
      onSuccess();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Modal title={`Assign "${task.title}"`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Select a team to assign this task to. The team will earn{" "}
          <span className="text-yellow-600 font-bold">⭐ {task.xp_reward} XP</span> upon completion.
        </p>
        {teamsQuery.isLoading ? (
          <LoadingSpinner />
        ) : teamsQuery.isError ? (
          <ErrorBanner message={(teamsQuery.error as Error).message} />
        ) : (
          <div>
            <label className="block text-xs font-semibold text-text-dark mb-1">Team</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="input-field"
            >
              <option value="">— Select a team —</option>
              {(teamsQuery.data || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.language} {t.language_level})
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={() => assignMutation.mutate()}
            disabled={!selectedTeamId || assignMutation.isPending}
            className="btn-primary flex-1 disabled:opacity-60"
          >
            {assignMutation.isPending ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </Modal>
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

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-dark mb-1">
        {label}
      </label>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (v >= 0) onChange(v);
        }}
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

// ImageUrlField is reused by the dormitory, medical and guide modals so
// admins can paste a hosted photo URL and see an immediate preview.
function ImageUrlField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-dark mb-1">
        Image URL <span className="text-muted font-normal">(optional)</span>
      </label>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://example.com/photo.jpg"
        className="input-field"
      />
      {value && (
        <img
          src={value}
          alt="preview"
          className="mt-2 h-28 rounded border border-gray-200 object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      )}
    </div>
  );
}
