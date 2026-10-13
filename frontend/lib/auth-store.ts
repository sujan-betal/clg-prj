"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Session = {
  access_token: string;
  refresh_token: string;
  role: string;
  username: string;
  permissions: string[];
};

type AuthState = {
  session: Session | null;
  setSession: (session: Session) => void;
  patchSession: (patch: Partial<Session>) => void;
  clear: () => void;
};

const LEGACY_KEYS = {
  access_token: "access_token",
  refresh_token: "refresh_token",
  role: "role",
  username: "username",
  permissions: "permissions",
};

function readLegacySession(): Session | null {
  if (typeof window === "undefined") return null;
  const access_token = localStorage.getItem(LEGACY_KEYS.access_token);
  if (!access_token) return null;
  let permissions: string[] = [];
  try {
    permissions = JSON.parse(localStorage.getItem(LEGACY_KEYS.permissions) || "[]");
  } catch {
    permissions = [];
  }
  return {
    access_token,
    refresh_token: localStorage.getItem(LEGACY_KEYS.refresh_token) || "",
    role: localStorage.getItem(LEGACY_KEYS.role) || "",
    username: localStorage.getItem(LEGACY_KEYS.username) || "",
    permissions,
  };
}

function clearLegacySession() {
  if (typeof window === "undefined") return;
  Object.values(LEGACY_KEYS).forEach((key) => localStorage.removeItem(key));
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      patchSession: (patch) =>
        set((state) =>
          state.session ? { session: { ...state.session, ...patch } } : state
        ),
      clear: () => {
        clearLegacySession();
        set({ session: null });
      },
    }),
    {
      name: "auth_session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        // Adopt a session written by the pre-Zustand localStorage layout.
        if (!state?.session) {
          const legacy = readLegacySession();
          if (legacy) useAuthStore.getState().setSession(legacy);
        }
      },
    }
  )
);

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  return useAuthStore.getState().session ?? readLegacySession();
}

export function getAccessToken(): string | null {
  return getSession()?.access_token ?? null;
}

export function getRefreshToken(): string | null {
  return getSession()?.refresh_token ?? null;
}

export function getRole(): string | null {
  return getSession()?.role ?? null;
}

export function getUsername(): string | null {
  return getSession()?.username ?? null;
}

export function getPermissions(): string[] {
  return getSession()?.permissions ?? [];
}

export function hasPermission(code: string): boolean {
  const perms = getPermissions();
  return perms.includes("ALL") || perms.includes(code.toUpperCase());
}

export function useHasPermission(code: string | string[]): boolean {
  const session = useAuthStore((s) => s.session);
  const codes = Array.isArray(code) ? code : [code];
  return codes.some((c) => {
    const perms = session?.permissions ?? [];
    return perms.includes("ALL") || perms.includes(c.toUpperCase());
  });
}

export function useSession() {
  return useAuthStore((s) => s.session);
}