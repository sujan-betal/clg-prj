"use client";

import { useEffect, useState } from "react";
import { useHasPermission } from "@/lib/auth-store";
import { PERMS_UPDATED_EVENT } from "@/lib/api";

// Re-render the caller whenever permissions are refreshed from the server.
export function usePermissionRefresh() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener(PERMS_UPDATED_EVENT, bump);
    return () => window.removeEventListener(PERMS_UPDATED_EVENT, bump);
  }, []);
  return tick;
}

// Page-level guard: renders children only if the user holds at least one
// of the given permissions (backend remains the source of truth and will
// still 403 direct API calls).
export default function RequirePermission({
  permission,
  children,
}: {
  permission: string | string[];
  children: React.ReactNode;
}) {
  usePermissionRefresh();
  const codes = Array.isArray(permission) ? permission : [permission];
  const allowed = useHasPermission(codes);

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <h1 className="font-display text-2xl font-black text-maroon">Access Denied</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink/70">
          You need the {codes.join(" or ")} permission to view this page.
          Please contact your administrator.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}