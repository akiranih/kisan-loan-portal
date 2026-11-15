
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginResult = {
  success?: boolean;
  error?: string;
  user?: {
    userId: string;
    role: string;
  };
};

export default function BankLoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          role: "BANK",
        }),
      });

      const data: LoginResult = await response.json();

      if (
        !response.ok ||
        data.success !== true ||
        data.user?.role !== "BANK"
      ) {
        setError(
          data.error || "Invalid Bank Officer credentials."
        );
        return;
      }

      setPassword("");

      router.replace("/bank/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Bank login request failed:", err);
      setError("Unable to connect to the login server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-green-50 px-4 py-10 text-gray-900">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-7 text-sm font-semibold text-green-800"
        >
          ← Back to Home
        </button>

        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">🏦</div>

          <h1 className="text-2xl font-bold text-green-900">
            Bank Officer Login
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Kisan Loan Portal
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="identifier"
              className="mb-2 block text-sm font-semibold"
            >
              Officer Login ID
            </label>

            <input
              id="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter assigned officer login ID"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
              required
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-700 py-4 font-bold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
