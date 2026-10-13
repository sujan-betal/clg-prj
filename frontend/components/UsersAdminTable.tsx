"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, hasPermission } from "@/lib/api";
import { qk, useApiQuery } from "@/lib/queries";
import PermissionInput from "@/components/PermissionInput";
import { usePermissionRefresh } from "@/components/RequirePermission";

export default function UsersAdminTable({ role, title }: { role: string; title: string }) {
  usePermissionRefresh();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [message, setMessage] = useState("");
  const [createdLink, setCreatedLink] = useState("");
  const pageSize = 10;

  const [createPerms, setCreatePerms] = useState<string[]>([]);
  const [newRole, setNewRole] = useState(role);

  const [editing, setEditing] = useState<any>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);

  const canGrant = hasPermission("ALL") || hasPermission("USER_UPDATE");
  const canCreate = hasPermission("ALL") || hasPermission("USER_CREATE");
  const canDelete = hasPermission("ALL") || hasPermission("USER_DELETE");
  const queryClient = useQueryClient();

  const usersQuery = { page, page_size: pageSize, search, role };

  const { data: userPage, isPending } = useApiQuery<{ users: any[]; total: number }>(
    qk.adminUsers(usersQuery),
    async () => {
      const res = await api.adminUsers(usersQuery);
      return {
        success: true,
        data: {
          users: res.data || [],
          total: res.pagination?.total || 0,
        },
      };
    }
  );
  const users = userPage?.users ?? [];
  const total = userPage?.total ?? 0;

  const { data: permNames = [] } = useApiQuery<string[]>(qk.permissionNames, () =>
    api.adminPermissions()
  );
  const { data: roles = [] } = useApiQuery<{ id: string; name: string; is_admin: boolean }[]>(
    qk.roles,
    () => api.adminRoles()
  );

  const createUser = useMutation({
    mutationFn: (payload: {
      username: string;
      email?: string;
      role?: string;
      designation?: string;
      permissions?: string[];
    }) => api.adminCreateUser(payload),
    onSuccess: (res) => {
      if (res.success) {
        setMessage(res.message);
        setCreatedLink((res.data as any)?.set_password_url || "");
        setUsername("");
        setEmail("");
        setDesignation("");
        setCreatePerms([]);
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      } else {
        setMessage(res.message || "Failed to create user");
      }
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ userid, status }: { userid: string; status: string }) =>
      api.adminUpdateUserStatus(userid, status),
    onSuccess: (res) => {
      if (res.success) queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      else setMessage(res.message);
    },
  });

  const deleteUser = useMutation({
    mutationFn: (userid: string) => api.adminDeleteUser(userid),
    onSuccess: (res) => {
      if (res.success) queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      else setMessage(res.message);
    },
  });

  const loadPermissions = useMutation({
    mutationFn: ({ user }: { user: any }) => api.adminUserPermissions(user.userid),
    onSuccess: (res, vars) => {
      if (!res.success) {
        setMessage(res.message || "Failed to load permissions");
        return;
      }
      setEditing(vars.user);
      setEditPerms(res.data || []);
    },
  });

  const savePermissions = useMutation({
    mutationFn: ({ userid, permissions }: { userid: string; permissions: string[] }) =>
      api.adminSetUserPermissions(userid, permissions),
    onSuccess: (res, vars) => {
      if (res.success) {
        setMessage(`Permissions updated for ${editing.username}`);
        setEditing(null);
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        queryClient.invalidateQueries({ queryKey: qk.permissionNames });
      } else {
        setMessage(res.message || "Failed to update permissions");
      }
    },
  });

  function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    createUser.mutate({
      username,
      email: email || undefined,
      role: newRole,
      designation: newRole === "TEACHER" && designation ? designation : undefined,
      permissions: canGrant ? createPerms : undefined,
    });
  }

  function toggleStatus(u: any) {
    const next = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    updateStatus.mutate({ userid: u.userid, status: next });
  }

  function remove(u: any) {
    if (!confirm(`Delete ${u.username}?`)) return;
    deleteUser.mutate(u.userid);
  }

  function openPermissions(u: any) {
    setMessage("");
    loadPermissions.mutate({ user: u });
  }

  function handleSavePermissions() {
    savePermissions.mutate({ userid: editing.userid, permissions: editPerms });
  }

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">{title}</h1>

      {canCreate ? (
        <form onSubmit={handleCreateUser} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
          <input required placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
          <input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
          {role === "TEACHER" && (
            <input placeholder="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
          )}
          {roles.length > 0 && (
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 text-sm">
              {roles.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          )}
          <button className="rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-cream">Add {title.slice(0, -1)}</button>
          <input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="ml-auto rounded-lg border border-ink/15 px-3 py-2 text-sm" />
        </form>
      ) : null}

      {canGrant && (
        <div className="mt-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
          <PermissionInput
            value={createPerms}
            onChange={setCreatePerms}
            suggestions={permNames}
            label="Access on creation"
          />
        </div>
      )}

      {message && (
        <div className="mt-3 rounded-lg border border-ink/10 bg-saffron-soft p-3 text-sm text-ink/80">
          <p>{message}</p>
          {createdLink && (
            <p className="mt-2 text-xs">
              If the email did not arrive, send this link to the new user:
              <br />
              <span className="break-all">{createdLink}</span>
            </p>
          )}
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-maroon text-cream">
              <th className="px-4 py-3 text-left">Username</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Permissions</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr><td colSpan={6} className="px-4 py-3">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-3">No users found.</td></tr>
            ) : users.map((u, i) => (
              <tr key={u.userid} className={i % 2 ? "bg-cream/60" : ""}>
                <td className="px-4 py-3">{u.username}</td>
                <td className="px-4 py-3">{u.email || "-"}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">{u.status}</td>
                <td className="px-4 py-3">
                  {u.permissions?.length ? (
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {u.permissions.map((p: string) => (
                        <span
                          key={p}
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            p === "ALL"
                              ? "border-maroon bg-maroon text-cream"
                              : "border-ink/15 text-ink/70"
                          }`}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-ink/40">None</span>
                  )}
                </td>
                <td className="px-4 py-3 space-x-2">
                  {canGrant && (
                    <button onClick={() => openPermissions(u)} className="rounded-full border border-ink/15 px-3 py-1 text-xs">
                      Access
                    </button>
                  )}
                  <button onClick={() => toggleStatus(u)} className="rounded-full border border-ink/15 px-3 py-1 text-xs">
                    {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                  {canDelete && (
                    <button onClick={() => remove(u)} className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-600">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border border-ink/15 px-3 py-1 disabled:opacity-40">Prev</button>
        <span>Page {page} of {Math.max(1, Math.ceil(total / pageSize))} ({total} total)</span>
        <button disabled={page * pageSize >= total} onClick={() => setPage(page + 1)} className="rounded border border-ink/15 px-3 py-1 disabled:opacity-40">Next</button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-display text-xl font-bold text-maroon">Access for {editing.username}</h2>
            <p className="mt-1 text-xs text-ink/50">
              Type the permission names this {title.slice(0, -1).toLowerCase()} should manage.
            </p>
            <div className="mt-3">
              <PermissionInput
                value={editPerms}
                onChange={setEditPerms}
                suggestions={permNames}
                label="Permissions"
              />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="rounded-full border border-ink/15 px-4 py-2 text-sm">Cancel</button>
              <button onClick={handleSavePermissions} className="rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-cream">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
