"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { PageSpinner } from "@/components/ui/spinner";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [status, user, router]);

  if (status === "loading") {
    return <PageSpinner label="Checking permissions…" />;
  }

  if (status === "anonymous" || !user) {
    return null;
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Users" />
        <ErrorState
          title="Access denied"
          message="Only administrators can manage users."
        />
      </div>
    );
  }

  return <>{children}</>;
}
