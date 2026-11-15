
import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

async function BankAuthGuard({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/bank/login");
  }

  if (user.role !== "BANK") {
    redirect("/");
  }

  return <>{children}</>;
}

export default function BankDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-gray-600">
            Loading Bank Dashboard...
          </p>
        </div>
      }
    >
      <BankAuthGuard>
        {children}
      </BankAuthGuard>
    </Suspense>
  );
}
