"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { PageSpinner } from "@/components/ui/spinner";

export default function HomePage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    } else if (status === "anonymous") {
      router.replace("/login");
    }
  }, [status, router]);

  return <PageSpinner label="Loading TaskFlow…" />;
}