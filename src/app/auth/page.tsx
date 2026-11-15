
"use client";

import { useEffect, useState } from "react";

type Role = "FARMER" | "BANK" | "GOVERNMENT";

type AuthUser = {
  userId: string;
  role: Role;
  loginIdentifier: string;
};

type ApiResult = {
  success?: boolean;
  authenticated?: boolean;
  message?: string;
  error?: string;
  user?: AuthUser | null;
};

const inputClass =
  "w-full rounded-xl border border-gray-300 px-4 py-3 " +
  "text-gray-900 outline-none focus:border-green-600";

export default function AuthenticationPage() {
  const [mode, setMode] = useState<"login" | "register">(
    "register"
  );

  const [role, setRole] = useState<Role>("FARMER");

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [currentUser, setCurrentUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function checkSession() {
    try {
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      const data: ApiResult = await response.json();

      setCurrentUser(
        response.ok && data.authenticated
          ? data.user || null
          : null
      );
    } catch {
      setCurrentUser(null);
    }
  }

  useEffect(() => {
    void checkSession();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const endpoint =
      mode === "register"
        ? "/api/auth/register"
        : "/api/auth/login";

    const body =
      mode === "register"
        ? {
            name,
            mobile,
            password,
            dob,
            village,
            district,
            state,
            pincode,
          }
        : {
            identifier: mobile,
            password,
            role,
          };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data: ApiResult = await response.json();

      if (!response.ok) {
        setError(
          data.error || "Authentication failed."
        );
        return;
      }

      setMessage(
        data.message || "Success."
      );

      setPassword("");

      await checkSession();
    } catch {
      setError(
        "Unable to connect to authentication server."
      );
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      setLoading(true);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setCurrentUser(null);
      setMessage("Logged out successfully.");
      setError("");
    } catch {
      setError("Unable to log out.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-green-50 px-4 py-10 text-gray-900">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-green-900">
            Kisan Loan Portal
          </h1>
          <p className="mt-2 text-gray-600">
            PostgreSQL Authentication
          </p>
        </header>

        {currentUser && (
          <section className="rounded-2xl bg-green-100 p-5">
            <h2 className="font-bold text-green-900">
              Logged In
            </h2>

            <p className="mt-2">
              Role: {currentUser.role}
            </p>

            <p className="mt-1">
              Login: {currentUser.loginIdentifier}
            </p>

            <p className="mt-1 break-all text-sm">
              User ID: {currentUser.userId}
            </p>

            <button
              type="button"
              onClick={logout}
              disabled={loading}
              className="mt-4 rounded-xl bg-red-700 px-5 py-3 font-semibold text-white"
            >
              Logout
            </button>
          </section>
        )}

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
                setMessage("");
              }}
              className={
                "rounded-xl px-4 py-3 font-semibold " +
                (mode === "register"
                  ? "bg-green-700 text-white"
                  : "bg-gray-100")
              }
            >
              Farmer Registration
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
              className={
                "rounded-xl px-4 py-3 font-semibold " +
                (mode === "login"
                  ? "bg-green-700 text-white"
                  : "bg-gray-100")
              }
            >
              Login
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="mb-4 rounded-xl bg-red-50 p-4 text-red-700"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="mb-4 rounded-xl bg-green-50 p-4 text-green-800"
            >
              {message}
            </p>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === "login" && (
              <label className="block font-semibold">
                Login as
                <select
                  className={`mt-2 ${inputClass}`}
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as Role)
                  }
                >
                  <option value="FARMER">Farmer</option>
                  <option value="BANK">Bank Officer</option>
                  <option value="GOVERNMENT">
                    Government Officer
                  </option>
                </select>
              </label>
            )}

            {mode === "register" && (
              <label className="block font-semibold">
                Full Name
                <input
                  className={`mt-2 ${inputClass}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={150}
                />
              </label>
            )}

            <label className="block font-semibold">
              {mode === "register"
                ? "Mobile Number"
                : "Login Identifier"}

              <input
                className={`mt-2 ${inputClass}`}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                placeholder={
                  mode === "register"
                    ? "10-digit mobile number"
                    : "Mobile or assigned officer login"
                }
              />
            </label>

            <label className="block font-semibold">
              Password
              <input
                className={`mt-2 ${inputClass}`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={mode === "register" ? 12 : undefined}
                required
              />
            </label>

            {mode === "register" && (
              <>
                <label className="block font-semibold">
                  Date of Birth
                  <input
                    className={`mt-2 ${inputClass}`}
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                  />
                </label>

                <label className="block font-semibold">
                  Village
                  <input
                    className={`mt-2 ${inputClass}`}
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                  />
                </label>

                <label className="block font-semibold">
                  District
                  <input
                    className={`mt-2 ${inputClass}`}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                </label>

                <label className="block font-semibold">
                  State
                  <input
                    className={`mt-2 ${inputClass}`}
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </label>

                <label className="block font-semibold">
                  PIN Code
                  <input
                    className={`mt-2 ${inputClass}`}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    maxLength={6}
                  />
                </label>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-green-700 py-4 font-bold text-white disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : mode === "register"
                ? "Create Farmer Account"
                : "Login"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
