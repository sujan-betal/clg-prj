"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { usePermissionRefresh } from "@/components/RequirePermission";

type Role = {
  id: string;
  name: string;
  description: string | null;
  is_admin: boolean;
  is_system: boolean;
  user_count: number;
};

export default function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);

  usePermissionRefresh();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.adminRoles();
    setLoading(false);
    if (res.success) setRoles(res.data || []);
    else setMessage(res.message || "Failed to load roles");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setName("");
    setDescription("");
    setIsAdmin(false);
    setEditing(null);
  }

  function startEdit(r: Role) {
    setEditing(r);
    setName(r.name);
    setDescription(r.description || "");
    setIsAdmin(r.is_admin);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const res = editing
      ? await api.adminUpdateRole(editing.id, { description, is_admin: isAdmin })
      : await api.adminCreateRole({ name, description, is_admin: isAdmin });

    if (res.success) {
      setMessage(res.message || "Saved");
      resetForm();
      load();
    } else {
      setMessage(res.message || "Failed to save role");
    }
  }

  async function remove(r: Role) {
    if (!confirm(`Delete role "${r.name}"?`)) return;
    const res = await api.adminDeleteRole(r.id);
    if (res.success) {
      setMessage(res.message || "Role deleted");
      load();
    } else {
      setMessage(res.message || "Failed to delete role");
    }
  }

  return (
    <>
      <h1 className="font-display text-3xl font-black text-maroon">Roles</h1>
      <p className="mt-1 text-ink/80">
        Create roles here, then give people permission names on the users pages.
      </p>

      <form onSubmit={submit} className="mt-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold tracking-widest text-ink/50">
          {editing ? `EDITING: ${editing.name}` : "NEW ROLE"}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {!editing && (
            <input
              required
              placeholder="Role name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
            />
          )}
          <input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
            Can open admin portal
          </label>

          <button className="rounded-full bg-maroon px-5 py-2 text-sm font-semibold text-cream">
            {editing ? "Save" : "Create Role"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {message && <p className="mt-3 text-sm text-ink/70">{message}</p>}

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm">Loading...</p>
        ) : roles.length === 0 ? (
          <p className="text-sm text-ink/50">No roles yet.</p>
        ) : (
          roles.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm"
            >
              <span className="font-display text-lg font-bold text-maroon">{r.name}</span>
              {r.is_admin && (
                <span className="rounded-full bg-maroon px-2 py-0.5 text-[10px] font-semibold text-cream">
                  ADMIN PORTAL
                </span>
              )}
              {r.is_system && (
                <span className="rounded-full border border-ink/20 px-2 py-0.5 text-[10px] font-semibold text-ink/60">
                  BUILT-IN
                </span>
              )}
              <span className="text-xs text-ink/50">{r.user_count} user(s)</span>
              {r.description && <span className="text-xs text-ink/60">{r.description}</span>}

              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => startEdit(r)}
                  className="rounded-full border border-ink/15 px-3 py-1 text-xs"
                >
                  Edit
                </button>
                {!r.is_system && (
                  <button
                    onClick={() => remove(r)}
                    className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}