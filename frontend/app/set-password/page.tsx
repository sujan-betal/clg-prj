"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api, saveSession } from "@/lib/api";

const roleHome: Record<string, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

function SetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const savePassword = useMutation({
    mutationFn: () => api.setPassword(token, password, confirm),
    onSuccess: (res) => {
      if (!res.success) {
        setError(res.message || "Could not set your password.");
        return;
      }

      const data = res.data || {};
      if (data.access_token) {
        // Signed in already, so go straight to the dashboard.
        saveSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token || "",
          role: data.role || "STUDENT",
          username: data.username || "",
          permissions: [],
        });
        router.replace(roleHome[(data.role || "").toUpperCase()] || "/login");
        return;
      }

      setMessage("Password set. Redirecting to login...");
      setTimeout(() => router.replace("/login"), 1500);
    },
  });

  useEffect(() => {
    if (!token) {
      setError(
        "This link is missing its code. Please use the link from your email, or ask your administrator for a new one."
      );
    }
  }, [token]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Please use at least 8 characters.");
      return;
    }
    if (/^[a-zA-Z]+$/.test(password) || /^[0-9]+$/.test(password)) {
      setError("Please mix letters and numbers, for example Astra2026.");
      return;
    }

    savePassword.mutate();
  }

  if (!token) {
    return (
      <section className="grain bg-maroon text-cream">
        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
          <h1 className="font-display text-4xl font-black">Set your password</h1>
          <p className="mt-4 rounded-2xl bg-cream p-5 text-sm text-ink shadow-xl">
            {error}
          </p>
          <a
            href="/login"
            className="mt-6 block rounded-full bg-cream py-3 text-center font-semibold text-maroon"
          >
            Back to login
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="grain bg-maroon text-cream">
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
        <h1 className="font-display text-4xl font-black">Choose your password</h1>
        <p className="mt-2 text-cream/80">
          Pick a password you will remember. You will go straight to your
          dashboard afterwards.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-2xl bg-cream p-6 text-ink shadow-xl"
        >
          <div>
            <label className="text-xs font-semibold tracking-widest text-ink/60">
              NEW PASSWORD
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-2.5"
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest text-ink/60">
              TYPE IT AGAIN
            </label>
            <input
              required
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-2.5"
            />
          </div>

          <p className="text-xs text-ink/60">
            Use 8 or more characters with both letters and numbers.
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}

          <button
            disabled={savePassword.isPending}
            className="w-full rounded-full bg-maroon py-3 font-semibold text-cream transition disabled:opacity-60"
          >
            {savePassword.isPending ? "Saving..." : "Save password and continue"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SetPasswordForm />
    </Suspense>
  );
}