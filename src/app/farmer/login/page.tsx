
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type LoginResponse = {
  success?: boolean;
  error?: string;
  message?: string;
};

function FarmerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const lang = searchParams.get("lang") || "en";

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full rounded-xl border border-gray-300 " +
    "bg-white px-4 py-3 text-gray-900 " +
    "outline-none focus:border-green-600";

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const cleanMobile = mobile.trim();

    if (!/^\d{10}$/.test(cleanMobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          identifier: cleanMobile,
          password,
          role: "FARMER",
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.error ||
            "Login failed. Please check your credentials."
        );
        return;
      }

      setPassword("");

      router.replace(
        `/farmer/dashboard?lang=${encodeURIComponent(lang)}`
      );
      router.refresh();
    } catch (err) {
      console.error("Farmer login error:", err);

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function openRegistration() {
    const params = new URLSearchParams({
      lang,
    });

    if (/^\d{10}$/.test(mobile.trim())) {
      params.set("mobile", mobile.trim());
    }

    router.push(`/farmer/register?${params.toString()}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-green-50 px-4 py-10 text-gray-900">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-lg sm:p-9">

        <button
          type="button"
          onClick={() =>
            router.push(`/?lang=${encodeURIComponent(lang)}`)
          }
          className="mb-7 text-sm font-semibold text-green-800 hover:underline"
        >
          ← Back to Home
        </button>

        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">🌾</div>

          <h1 className="text-2xl font-bold text-green-900">
            Farmer Login
          </h1>

          <p className="mt-2 text-gray-600">
            Welcome to Kisan Loan Portal
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Sign in using your registered mobile number
            and password.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="mobile"
              className="mb-2 block text-sm font-semibold"
            >
              Mobile Number
            </label>

            <input
              id="mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={mobile}
              onChange={(event) => {
                setMobile(
                  event.target.value.replace(/\D/g, "").slice(0, 10)
                );
                setError("");
              }}
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
              className={inputClass}
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
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Enter your password"
              className={inputClass}
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
            className="w-full rounded-xl bg-green-700 py-4 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Signing in..."
              : "Login to Farmer Dashboard →"}
          </button>
        </form>

        <div className="mt-7 border-t border-gray-200 pt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?
          </p>

          <button
            type="button"
            onClick={openRegistration}
            className="mt-3 font-semibold text-green-800 hover:underline"
          >
            Register as a Farmer →
          </button>
        </div>
      </div>
    </main>
  );
}

export default function FarmerLoginPage() {
  return (
    <Suspense fallback={<p>Loading farmer login...</p>}>
      <FarmerLoginContent />
    </Suspense>
  );
}
