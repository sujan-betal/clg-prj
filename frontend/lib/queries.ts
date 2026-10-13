"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

export type ApiResult<T> = { success: boolean; message?: string; data?: T };

/** Unwrap the `{ success, data }` envelope the backend returns. */
export async function unwrap<T>(promise: Promise<ApiResult<T>>): Promise<T> {
  const res = await promise;
  if (!res.success) throw new Error(res.message || "Request failed");
  return (res.data ?? (undefined as unknown)) as T;
}

export const qk = {
  home: ["public", "home"] as const,
  siteContent: ["public", "site-content"] as const,
  notices: ["public", "notices"] as const,
  courses: ["public", "courses"] as const,
  departments: ["public", "departments"] as const,
  faculty: ["public", "faculty"] as const,
  events: ["public", "events"] as const,
  gallery: ["public", "gallery"] as const,
  admissions: ["public", "admissions"] as const,

  me: ["auth", "me"] as const,
  stats: ["admin", "stats"] as const,
  adminUsers: (params: unknown) => ["admin", "users", params] as const,
  permissionNames: ["admin", "permission-names"] as const,
  roles: ["admin", "roles"] as const,
  adminDepartments: ["admin", "departments"] as const,
  adminCourses: ["admin", "courses"] as const,
  adminAdmissions: ["admin", "admissions"] as const,
  adminFees: ["admin", "fees"] as const,
  adminExams: ["admin", "exams"] as const,
  adminNotices: ["admin", "notices"] as const,
  adminContent: ["admin", "content"] as const,
  adminLeave: ["admin", "leave"] as const,
  adminReports: ["admin", "reports"] as const,
  adminAuditLogs: ["admin", "audit-logs"] as const,

  studentProfile: ["student", "profile"] as const,
  studentAttendance: ["student", "attendance"] as const,
  studentMarks: ["student", "marks"] as const,
  studentNotices: ["student", "notices"] as const,
  studentFees: ["student", "fees"] as const,
  studentMaterials: ["student", "materials"] as const,
  studentAssignments: ["student", "assignments"] as const,
  studentCertificates: ["student", "certificates"] as const,
  studentLeave: ["student", "leave"] as const,

  teacherProfile: ["teacher", "profile"] as const,
  teacherSubjects: ["teacher", "subjects"] as const,
  teacherStudents: ["teacher", "students"] as const,
  teacherExams: ["teacher", "exams"] as const,
  teacherAttendance: ["teacher", "attendance"] as const,
  teacherMarks: ["teacher", "marks"] as const,
  teacherMaterials: ["teacher", "materials"] as const,
  teacherAssignments: ["teacher", "assignments"] as const,
  teacherLeave: ["teacher", "leave"] as const,
  teacherNotices: ["teacher", "notices"] as const,
};

/**
 * useQuery for an api call that resolves to `res.data`.
 * Loading/error UI stays inline with the component.
 *
 * Writes use `useMutation` from @tanstack/react-query directly (mutationFn is
 * the api call itself) so the `{ success, message }` envelope stays available
 * for form feedback.
 */
export function useApiQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<ApiResult<T>>,
  options?: Partial<UseQueryOptions<T, Error, T, readonly unknown[]>>
) {
  return useQuery<T, Error>({
    queryKey,
    queryFn: () => unwrap(queryFn()),
    ...options,
  });
}