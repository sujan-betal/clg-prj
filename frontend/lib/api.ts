import {
  getAccessToken,
  getRefreshToken,
  getSession,
  useAuthStore,
  type Session,
} from "@/lib/auth-store";

export {
  getAccessToken,
  getRefreshToken,
  getPermissions,
  getRole,
  getUsername,
  hasPermission,
} from "@/lib/auth-store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const PERMS_UPDATED_EVENT = "permissions-updated";

export function saveSession(data: Session) {
  useAuthStore.getState().setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    role: data.role,
    username: data.username,
    permissions: data.permissions || [],
  });
}

export function clearSession() {
  useAuthStore.getState().clear();
}

// Re-fetch own permissions from the server so that changes made by an
// admin (or a role update) apply without forcing the user to log in again.
export async function refreshPermissions(): Promise<string[]> {
  try {
    const res = await apiFetch("/api/auth/me");
    if (res?.success && res.data && typeof window !== "undefined") {
      const perms: string[] = res.data.permissions || [];
      useAuthStore.getState().patchSession({
        permissions: perms,
        role: res.data.role || getSession()?.role || "",
        username: res.data.username || getSession()?.username || "",
      });
      window.dispatchEvent(new Event(PERMS_UPDATED_EVENT));
      return perms;
    }
  } catch {
    // Network/parse failure — keep the cached permissions.
  }
  return getSession()?.permissions ?? [];
}

async function tryRefresh(): Promise<string | null> {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return null;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    });
    const json = await res.json();
    if (json.success && json.data?.access_token) {
      useAuthStore.getState().patchSession({
        access_token: json.data.access_token,
        refresh_token: json.data.refresh_token,
      });
      return json.data.access_token;
    }
  } catch {
    return null;
  }
  return null;
}

export async function apiFetch(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<any> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let token = getAccessToken();
  if (auth && token) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = await res.json().catch(() => ({ success: false, message: "Invalid server response" }));

  if (auth && (res.status === 401) && typeof window !== "undefined") {
    const newToken = await tryRefresh();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      json = await res.json().catch(() => ({ success: false, message: "Invalid server response" }));
    } else {
      clearSession();
      window.location.href = "/login";
    }
  }

  return json;
}

export const api = {
  login: (username: string, password: string) =>
    apiFetch("/api/auth/login", { method: "POST", body: { username, password }, auth: false }),
  me: () => apiFetch("/api/auth/me"),
  changePassword: (current_password: string, new_password: string, confirm_password: string) =>
    apiFetch("/api/auth/password/change", { method: "PUT", body: { current_password, new_password, confirm_password } }),
  logout: () => apiFetch("/api/auth/logout", { method: "POST" }),
  setPassword: (token: string, new_password: string, confirm_password: string) =>
    apiFetch("/api/auth/set-password", {
      method: "POST",
      body: { token, new_password, confirm_password },
      auth: false,
    }),
  forgotPassword: (email: string) =>
    apiFetch("/api/auth/forgot-password", { method: "POST", body: { email }, auth: false }),

  adminUsers: (params: { page?: number; page_size?: number; search?: string; role?: string }) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && q.append(k, String(v)));
    return apiFetch(`/api/admin/users?${q.toString()}`);
  },
  adminCreateUser: (payload: {
    username: string;
    email?: string;
    role?: string;
    status?: string;
    designation?: string;
    department_id?: string;
    permissions?: string[];
  }) => apiFetch("/api/admin/users", { method: "POST", body: payload }),
  adminPermissions: () => apiFetch("/api/admin/permission-names"),
  adminRoles: () => apiFetch("/api/admin/roles"),
  adminCreateRole: (payload: { name: string; description?: string; is_admin?: boolean }) =>
    apiFetch("/api/admin/roles", { method: "POST", body: payload }),
  adminUpdateRole: (id: string, payload: { description?: string; is_admin?: boolean }) =>
    apiFetch(`/api/admin/roles/${id}`, { method: "PUT", body: payload }),
  adminDeleteRole: (id: string) => apiFetch(`/api/admin/roles/${id}`, { method: "DELETE" }),
  adminUserPermissions: (userid: string) => apiFetch(`/api/admin/users/${userid}/permissions`),
  adminSetUserPermissions: (userid: string, permissions: string[]) =>
    apiFetch(`/api/admin/users/${userid}/permissions`, { method: "PUT", body: { permissions } }),
  adminUpdateUserStatus: (userid: string, status: string) =>
    apiFetch(`/api/admin/users/${userid}/status`, { method: "PUT", body: { status } }),
  adminDeleteUser: (userid: string) =>
    apiFetch(`/api/admin/users/${userid}`, { method: "DELETE" }),
  adminStats: () => apiFetch("/api/admin/stats"),

  studentProfile: () => apiFetch("/api/student/profile"),
  studentUpdateProfile: (payload: { guardian_phone?: string; section?: string }) =>
    apiFetch("/api/student/profile", { method: "PUT", body: payload }),
  studentAttendance: () => apiFetch("/api/student/attendance"),
  studentMarks: () => apiFetch("/api/student/marks"),
  studentNotices: () => apiFetch("/api/student/notices"),

  teacherProfile: () => apiFetch("/api/teacher/profile"),
  teacherUpdateProfile: (payload: { designation?: string; department_id?: string }) =>
    apiFetch("/api/teacher/profile", { method: "PUT", body: payload }),
  teacherSubjects: () => apiFetch("/api/teacher/subjects"),
  teacherPostNotice: (payload: { title: string; content: string; audience?: string }) =>
    apiFetch("/api/teacher/notices", { method: "POST", body: payload }),

  studentFees: () => apiFetch("/api/student/fees"),
  studentMaterials: () => apiFetch("/api/student/materials"),
  studentAssignments: () => apiFetch("/api/student/assignments"),
  studentCertificates: () => apiFetch("/api/student/certificates"),
  studentLeave: () => apiFetch("/api/student/leave"),
  studentApplyLeave: (payload: { from_date: string; to_date: string; reason?: string }) =>
    apiFetch("/api/student/leave", { method: "POST", body: payload }),

  teacherStudents: () => apiFetch("/api/teacher/students"),
  teacherExams: () => apiFetch("/api/teacher/exams"),
teacherAttendance: () => apiFetch("/api/teacher/attendance"),
  teacherMarkAttendance: (records: { student_id: string; subject_id: string; date: string; status: string }[]) =>
    apiFetch("/api/teacher/attendance", { method: "POST", body: { records } }),
  teacherMarks: () => apiFetch("/api/teacher/marks"),
  teacherAddMarks: (payload: { student_id: string; exam_id: string; subject_id: string; marks_obtained: number; marks_total: number }) =>
    apiFetch("/api/teacher/marks", { method: "POST", body: payload }),
  teacherMaterials: () => apiFetch("/api/teacher/materials"),
  teacherAddMaterial: (payload: { title: string; subject_id: string; file_url?: string; file_type?: string; file_size?: number }) =>
    apiFetch("/api/teacher/materials", { method: "POST", body: payload }),
  teacherAssignments: () => apiFetch("/api/teacher/assignments"),
  teacherAddAssignment: (payload: { title: string; description?: string; subject_id: string; section?: string; due_date?: string }) =>
    apiFetch("/api/teacher/assignments", { method: "POST", body: payload }),
  teacherLeave: () => apiFetch("/api/teacher/leave"),
  teacherApplyLeave: (payload: { from_date: string; to_date: string; reason?: string }) =>
    apiFetch("/api/teacher/leave", { method: "POST", body: payload }),

  adminDepartments: () => apiFetch("/api/admin/departments"),
  adminCreateDepartment: (payload: { name: string; code: string; description?: string }) =>
    apiFetch("/api/admin/departments", { method: "POST", body: payload }),
  adminCourses: () => apiFetch("/api/admin/courses"),
  adminCreateCourse: (payload: { department_id: string; name: string; code: string; duration_years?: number; total_seats?: number; annual_fee?: number }) =>
    apiFetch("/api/admin/courses", { method: "POST", body: payload }),
  adminAdmissions: () => apiFetch("/api/admin/admissions"),
  adminUpdateAdmission: (id: string, status: string) =>
    apiFetch(`/api/admin/admissions/${id}/status`, { method: "PUT", body: { status } }),
  adminFees: () => apiFetch("/api/admin/fees"),
  adminCreateFee: (payload: { course_id: string; head: string; amount: number; due_date?: string }) =>
    apiFetch("/api/admin/fees", { method: "POST", body: payload }),
  adminExams: () => apiFetch("/api/admin/exams"),
  adminCreateExam: (payload: { name: string; course_id?: string; semester?: number; start_date?: string; is_published?: number }) =>
    apiFetch("/api/admin/exams", { method: "POST", body: payload }),
  adminNotices: () => apiFetch("/api/admin/notices"),
  adminContent: () => apiFetch("/api/admin/content"),
  adminLeave: () => apiFetch("/api/admin/leave"),
  adminUpdateLeave: (id: string, status: string) =>
    apiFetch(`/api/admin/leave/${id}/status`, { method: "PUT", body: { status } }),
  adminReports: () => apiFetch("/api/admin/reports"),
  adminAuditLogs: () => apiFetch("/api/admin/audit-logs"),

  publicHome: () => apiFetch("/api/public/home", { auth: false }),
  publicSiteContent: () => apiFetch("/api/public/site-content", { auth: false }),
  publicNotices: () => apiFetch("/api/public/notices", { auth: false }),
  publicCourses: () => apiFetch("/api/public/courses", { auth: false }),
  publicDepartments: () => apiFetch("/api/public/departments", { auth: false }),
  publicFaculty: () => apiFetch("/api/public/faculty", { auth: false }),
  publicEvents: () => apiFetch("/api/public/events", { auth: false }),
  publicGallery: () => apiFetch("/api/public/gallery", { auth: false }),
  publicApply: (payload: { applicant_name: string; email: string; phone: string; course_id?: string }) =>
    apiFetch("/api/public/admissions", { method: "POST", body: payload, auth: false }),
  publicContact: (payload: { name: string; email: string; message: string }) =>
    apiFetch("/api/public/contact", { method: "POST", body: payload, auth: false }),
};
