
"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type RegistrationResponse = {
  success?: boolean;
  error?: string;
  message?: string;
};

function FarmerRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const lang = searchParams.get("lang") || "en";
  const initialMobile = searchParams.get("mobile") || "";

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState(
    /^\d{10}$/.test(initialMobile) ? initialMobile : ""
  );
  const [dob, setDob] = useState("");

  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [pincode, setPincode] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxDOB = useMemo(() => {
    const today = new Date();

    const year = today.getFullYear() - 18;
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);

  const inputClass =
    "w-full rounded-xl border border-gray-300 " +
    "bg-white px-4 py-3 text-gray-900 " +
    "outline-none focus:border-green-600";

  const labelClass =
    "mb-2 block text-sm font-semibold text-gray-700";

  async function handleRegistration(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^\d{10}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!dob || dob > maxDOB) {
      setError(
        "You must be at least 18 years old to register."
      );
      return;
    }

    if (
      !state.trim() ||
      !district.trim() ||
      !village.trim()
    ) {
      setError(
        "Please enter your state, district and village."
      );
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      setError("Please enter a valid 6-digit PIN code.");
      return;
    }

    if (password.length < 12 || password.length > 72) {
      setError(
        "Password must be between 12 and 72 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          name: name.trim(),
          mobile,
          password,
          dob,
          state: state.trim(),
          district: district.trim(),
          village: village.trim(),
          pincode,
        }),
      });

      const data: RegistrationResponse =
        await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.error ||
            "Registration failed. Please try again."
        );
        return;
      }

      setPassword("");
      setConfirmPassword("");

      router.replace(
        `/farmer/dashboard?lang=${encodeURIComponent(lang)}`
      );
      router.refresh();
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-green-50 px-4 py-10 text-gray-900">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-lg sm:p-9">

        <button
          type="button"
          onClick={() =>
            router.push(
              `/farmer/login?lang=${encodeURIComponent(lang)}`
            )
          }
          className="mb-7 text-sm font-semibold text-green-800 hover:underline"
        >
          ← Back to Farmer Login
        </button>

        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">🌾</div>

          <h1 className="text-2xl font-bold text-green-900">
            Farmer Registration
          </h1>

          <p className="mt-2 text-gray-600">
            Create your Kisan Loan Portal account
          </p>
        </div>

        <form
          onSubmit={handleRegistration}
          className="space-y-6"
        >
          <section className="space-y-4">
            <h2 className="border-b pb-3 text-lg font-bold text-green-900">
              Personal Information
            </h2>

            <div>
              <label
                htmlFor="fullName"
                className={labelClass}
              >
                Full Name *
              </label>

              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                maxLength={150}
                className={inputClass}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="mobile"
                  className={labelClass}
                >
                  Mobile Number *
                </label>

                <input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={mobile}
                  onChange={(e) =>
                    setMobile(
                      e.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="dob"
                  className={labelClass}
                >
                  Date of Birth *
                </label>

                <input
                  id="dob"
                  type="date"
                  max={maxDOB}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className={inputClass}
                  required
                />

                <p className="mt-2 text-xs text-gray-500">
                  You must be at least 18 years old.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="border-b pb-3 text-lg font-bold text-green-900">
              Address Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="state"
                  className={labelClass}
                >
                  State *
                </label>

                <input
                  id="state"
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Enter your state"
                  maxLength={100}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="district"
                  className={labelClass}
                >
                  District *
                </label>

                <input
                  id="district"
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Enter your district"
                  maxLength={100}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="village"
                  className={labelClass}
                >
                  Village *
                </label>

                <input
                  id="village"
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="Enter your village"
                  maxLength={150}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="pincode"
                  className={labelClass}
                >
                  PIN Code *
                </label>

                <input
                  id="pincode"
                  type="text"
                  inputMode="numeric"
                  value={pincode}
                  onChange={(e) =>
                    setPincode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  placeholder="6-digit PIN code"
                  maxLength={6}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="border-b pb-3 text-lg font-bold text-green-900">
              Account Security
            </h2>

            <div>
              <label
                htmlFor="password"
                className={labelClass}
              >
                Create Password *
              </label>

              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                minLength={12}
                maxLength={72}
                className={inputClass}
                required
              />

              <p className="mt-2 text-xs text-gray-500">
                Use 12–72 characters. Choose a password
                you don't use for other accounts.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className={labelClass}
              >
                Confirm Password *
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Re-enter your password"
                className={inputClass}
                required
              />
            </div>
          </section>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-700 py-4 font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Creating Account..."
              : "Register & Continue to Dashboard →"}
          </button>
        </form>

        <div className="mt-7 border-t border-gray-200 pt-5 text-center">
          <p className="text-sm text-gray-600">
            Already registered?
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/farmer/login?lang=${encodeURIComponent(lang)}`
              )
            }
            className="mt-2 font-semibold text-green-800 hover:underline"
          >
            Login to Your Account →
          </button>
        </div>
      </div>
    </main>
  );
}

export default function FarmerRegistrationPage() {
  return (
    <Suspense fallback={<p>Loading registration...</p>}>
      <FarmerRegistrationContent />
    </Suspense>
  );
}
