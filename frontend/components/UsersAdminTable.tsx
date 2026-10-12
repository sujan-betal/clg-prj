"use client";

import { useCallback, useEffect, useState } from "react";
import { api, hasPermission } from "@/lib/api";
import PermissionInput from "@/components/PermissionInput";
import { usePermissionRefresh } from "@/components/RequirePermission";

export default function UsersAdminTable({ role, title }: { role: string; title: string }) {
  usePermissionRefresh();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [message, setMessage] = useState("");
  const [createdLink, setCreatedLink] = useState("");
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const [permNames, setPermNames] = useState<string[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string; is_admin: boolean }[]>([]);
  const [createPerms, setCreatePerms] = useState<string[]>([]);
  const [newRole, setNewRole] = useState(role);

  const [editing, setEditing] = useState<any>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);

  const canGrant = hasPermission("ALL") || hasPermission("USER_UPDATE");
  const canCreate = hasPermission("ALL") || hasPermission("USER_CREATE");
  const canDelete = hasPermission("ALL") || hasPermission("USER_DELETE");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.adminUsers({ page, page_size: pageSize, search, role });
    setLoading(false);
    if (res.success) {
      setUsers(res.data || []);
      setTotal(res.pagination?.total || 0);
    } else {
      setMessage(res.message || "Failed to load users");
    }
  }, [page, search, role]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.adminPermissions().then((res) => {
      if (res.success) setPermNames(res.data || []);
    });
    api.adminRoles().then((res) => {
      if (res.success) setRoles(res.data || []);
    });
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await api.adminCreateUser({
      username,
      email: email || undefined,
      role: newRole,
      designation: newRole === "TEACHER" && designation ? designation : undefined,
      permissions: canGrant ? createPerms : undefined,
    });
    if (res.success) {
      setMessage(res.message);
      setCreatedLink((res.data as any)?.set_password_url || "");
      setUsername("");
      setEmail("");
      setDesignation("");
      setCreatePerms([]);
      load();
    } else {
      setMessage(res.message || "Failed to create user");
    }
  }

  async function toggleStatus(u: any) {
    const next = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await api.adminUpdateUserStatus(u.userid, next);
    if (res.success) load();
    else setMessage(res.message);
  }

  async function remove(u: any) {
    if (!confirm(`Delete ${u.username}?`)) return;
    const res = await api.adminDeleteUser(u.userid);
    if (res.success) load();
    else setMessage(res.message);
  }

  async function openPermissions(u: any) {
    setMessage("");
    const res = await api.adminUserPermissions(u.userid);
    if (!res.success) {
      setMessage(res.message || "Failed to load permissions");
      return;
    }
    setEditing(u);
    setEditPerms(res.data || []);
  }

  async function savePermissions() {
    const res = await api.adminSetUserPermissions(editing.userid, editPerms);
    if (res.success) {
      setMessage(`Permissions updated for ${editing.username}`);
      setEditing(null);
      load();
    } else {
      setMessage(res.message || "Failed to update permissions");
    }
  }

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">{title}</h1>

      {canCreate ? (
        <form onSubmit={createUser} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
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
            {loading ? (
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
              <button onClick={savePermissions} className="rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-cream">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
