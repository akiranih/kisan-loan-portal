
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") || "en";

  const cards = [
    {
      title: "Apply for Loan",
      description: "Start a new agricultural loan application",
      icon: "📝",
      path: "/farmer/apply",
    },
    {
      title: "My Applications",
      description: "View your applications and loan status",
      icon: "📋",
      path: "/farmer/applications",
    },
    {
      title: "Complaints",
      description: "Raise or track a complaint",
      icon: "💬",
      path: "/farmer/complaints",
    },
  ];

  return (
    <main className="min-h-screen bg-green-50 p-4 text-gray-900 sm:p-8">
      <div className="mx-auto max-w-4xl">

        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌱</span>
            <span className="text-lg font-bold text-green-800">
              Kisan Loan Portal
            </span>
          </div>

          <button
            onClick={() => router.push("/")}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            Exit Demo
          </button>
        </header>

        <section className="mb-8 rounded-3xl bg-green-700 p-7 text-white">
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
            Welcome to Farmer Dashboard
          </h1>

          <p className="text-green-100">
            Apply for agricultural loans and track
            your applications easily.
          </p>

          <p className="mt-4 text-xs text-green-100">
            Demo only — no authenticated session or saved
            farmer records.
          </p>
        </section>

        <h2 className="mb-5 text-xl font-bold">
          What would you like to do?
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {cards.map((card) => (
            <button
              key={card.title}
              onClick={() =>
                router.push(`${card.path}?lang=${lang}`)
              }
              className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-green-500 hover:shadow-md"
            >
              <div className="mb-4 text-4xl">
                {card.icon}
              </div>

              <h3 className="mb-2 text-lg font-semibold">
                {card.title}
              </h3>

              <p className="text-sm text-gray-600">
                {card.description}
              </p>

              <p className="mt-5 font-semibold text-green-700">
                Open →
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-green-200 bg-white p-6">
          <h3 className="mb-2 font-bold">
            Track Your Loan Transparently
          </h3>

          <p className="text-sm text-gray-600">
            In the completed application, you will be
            able to see when your application was
            received, reviewed, approved or rejected,
            along with the reasons recorded by the bank.
          </p>
        </div>

      </div>
    </main>
  );
}

export default function FarmerDashboard() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <DashboardContent />
    </Suspense>
  );
}
