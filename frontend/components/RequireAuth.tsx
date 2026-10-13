"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore, useSession } from "@/lib/auth-store";
import { unwrap } from "@/lib/queries";

const roleHome: Record<string, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

export default function RequireAuth({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const session = useSession();
  const patchSession = useAuthStore((s) => s.patchSession);
  const started = useRef(false);

  // Pull fresh permissions/role so admin-side changes apply without re-login.
  const refresh = useMutation({
    mutationFn: () => unwrap<any>(api.me()),
    onSuccess: (me) => {
      patchSession({
        permissions: me.permissions || [],
        role: me.role || session?.role || "",
        username: me.username || session?.username || "",
      });
    },
  });

  const accessToken = session?.access_token;

  useEffect(() => {
    if (!accessToken) return;
    if (started.current) return;
    started.current = true;
    refresh.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    const userRole = (session?.role || "").toUpperCase();
    if (userRole !== role) router.replace(roleHome[userRole] || "/login");
  }, [accessToken, session?.role, role, router]);

  return <>{children}</>;
}