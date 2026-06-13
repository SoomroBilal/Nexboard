"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DASHBOARD_ROUTES } from "@/lib/constants";
import type { UserRole } from "@/lib/types";

export function AuthGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/signin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.push("/auth/signin");
        return;
      }

      const userRole = profile.role as UserRole;

      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(userRole)) {
          // Redirect to the user's appropriate dashboard
          const route = DASHBOARD_ROUTES[userRole] || "/dashboard";
          router.push(route);
          return;
        }
      }

      setAuthorized(true);
      setLoading(false);
    };

    checkAuth();
  }, [router, allowedRoles]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-800" />
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
