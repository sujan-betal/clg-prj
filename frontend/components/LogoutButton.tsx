"use client";

import { api, clearSession } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const logout = useMutation({
    mutationFn: () => api.logout(),
    onSettled: () => {
      // Drop cached data so the next user never sees the previous session.
      queryClient.clear();
      clearSession();
      router.replace("/login");
    },
  });

  return (
    <button
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
      className="mt-4 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm hover:bg-saffron-soft hover:text-maroon transition disabled:opacity-60"
    >
      {logout.isPending ? "Logging out..." : "Logout"}
    </button>
  );
}