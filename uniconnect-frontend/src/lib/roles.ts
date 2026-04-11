// Centralised list of role identifiers used by the backend. Keep this
// in sync with internal/model/models.go::AllRoles on the server.
export const ROLES = {
  STUDENT: "student",
  ADMIN: "admin",
  MANAGER: "manager",
  TEACHER: "teacher",
  DORMITORY_MANAGER: "dormitory_manager",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  admin: "Administrator",
  manager: "Job Manager",
  teacher: "Teacher / Counsellor",
  dormitory_manager: "Dormitory Manager",
};

export function isStaffRole(role?: string | null): boolean {
  if (!role) return false;
  return role !== ROLES.STUDENT;
}

export function canAccessAdmin(role?: string | null): boolean {
  return isStaffRole(role);
}

// Section-level permissions used by the admin panel.
export function canManageDorms(role?: string | null): boolean {
  return role === ROLES.ADMIN || role === ROLES.DORMITORY_MANAGER;
}
export function canManageJobs(role?: string | null): boolean {
  return role === ROLES.ADMIN || role === ROLES.MANAGER;
}
export function canManageGuides(role?: string | null): boolean {
  return role === ROLES.ADMIN || role === ROLES.TEACHER;
}
export function canManageMedical(role?: string | null): boolean {
  return role === ROLES.ADMIN;
}
export function canManagePsychology(role?: string | null): boolean {
  return role === ROLES.ADMIN || role === ROLES.TEACHER;
}
export function canManageUsers(role?: string | null): boolean {
  return role === ROLES.ADMIN;
}
export function canManageContent(role?: string | null): boolean {
  return role === ROLES.ADMIN;
}
