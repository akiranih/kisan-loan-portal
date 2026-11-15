
import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

async function GovernmentAuthGuard({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/government/login");
  }

  if (user.role !== "GOVERNMENT") {
    redirect("/");
  }

  return <>{children}</>;
}

export default function GovernmentDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-gray-600">
            Loading Government Dashboard...
          </p>
        </div>
      }
    >
      <GovernmentAuthGuard>
        {children}
      </GovernmentAuthGuard>
    </Suspense>
  );
}
