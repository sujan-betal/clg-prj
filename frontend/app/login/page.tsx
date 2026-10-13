"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, saveSession } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetNotice, setResetNotice] = useState("");

  const forgotPassword = useMutation({
    mutationFn: () => api.forgotPassword(resetEmail),
    onSuccess: (res) =>
      setResetNotice(
        res.message || "If that email is registered, a reset link is on its way."
      ),
  });

  const login = useMutation({
    mutationFn: () => api.login(username, password),
    onSuccess: (res) => {
      if (!res.success) {
        setError(res.message || "Login failed");
        return;
      }

      setNotice("");
      saveSession({
        access_token: res.data.access_token,
        refresh_token: res.data.refresh_token,
        role: res.data.role,
        username: res.data.username,
        permissions: res.data.permissions || [],
      });

      // Drop cached data so the next login never sees the previous session.
      queryClient.clear();

      if (res.data.is_reset) {
        router.replace("/change-password");
        return;
      }

      const role = (res.data.role || "").toUpperCase();
      if (role === "ADMIN") router.replace("/admin");
      else if (role === "TEACHER") router.replace("/teacher");
      else router.replace("/student");
    },
  });

  function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setResetNotice("");
    forgotPassword.mutate();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    login.mutate();
  }

  if (forgot) {
    return (
      <section className="grain bg-maroon text-cream">
        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
          <h1 className="font-display text-4xl font-black">Reset your password</h1>
          <p className="mt-2 text-cream/80">
            Enter the email your account was created with. We will send you a
            link to choose a new password.
          </p>
          <form
            onSubmit={handleForgot}
            className="mt-8 space-y-4 rounded-2xl bg-cream p-6 text-ink shadow-xl"
          >
            <input
              required
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-ink/15 px-4 py-2.5"
            />
            {resetNotice && <p className="text-sm text-emerald-700">{resetNotice}</p>}
            <button className="w-full rounded-full bg-maroon py-3 font-semibold text-cream">
              Send reset link
            </button>
            <button
              type="button"
              onClick={() => {
                setForgot(false);
                setResetNotice("");
              }}
              className="w-full text-sm text-ink/60 underline"
            >
              Back to sign in
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="grain bg-maroon text-cream">
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
        <h1 className="font-display text-4xl font-black">Portal Login</h1>
        <p className="mt-2 text-cream/80">
          One login for students, teachers, and administrators. Your role decides
          where you land.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl bg-cream p-6 text-ink shadow-xl">
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username or email"
            className="w-full rounded-lg border border-ink/15 px-4 py-2.5"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-ink/15 px-4 py-2.5"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-emerald-700">{notice}</p>}
          <button
            disabled={login.isPending}
            className="w-full rounded-full bg-maroon py-3 font-semibold text-cream hover:bg-maroon-dark transition disabled:opacity-60"
          >
            {login.isPending ? "Signing in..." : "Sign In"}
          </button>
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setForgot(true)}
              className="text-ink/60 underline"
            >
              Forgot password?
            </button>
            <a href="/set-password" className="text-ink/60 underline">
              I have a setup link
            </a>
          </div>
        </form>
      </div>
    </section>
  );
}
