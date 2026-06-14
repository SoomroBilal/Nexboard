"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ProductTour } from "@/components/tour/ProductTour";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

export function DashboardLayout({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState<UserRole>("new_hire");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<Record<string, unknown>>({});
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setEmail(user.email ?? "");
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role, company_id, profile_data")
          .eq("id", user.id)
          .single();
        if (profile) {
          setName(profile.full_name);
          setRole(profile.role as UserRole);
          const rawProfileData = (profile.profile_data ?? {}) as Record<string, unknown>;
          setProfileData(rawProfileData);

          const forceTour = typeof window !== "undefined" && localStorage.getItem("force_product_tour") === "1";
          if (forceTour) {
            localStorage.removeItem("force_product_tour");
          }

          const completed = rawProfileData.product_tour_completed === true;
          if (!completed || forceTour) {
            setTourOpen(true);
          }

          if (profile.company_id) {
            const { data: company } = await supabase
              .from("companies")
              .select("name")
              .eq("id", profile.company_id)
              .single();
            if (company) setCompanyName(company.name);
          }
        }
      }
    };
    fetchProfile();
  }, []);

  const handleTourComplete = async () => {
    setTourOpen(false);
    if (!userId) return;

    const nextProfileData = {
      ...profileData,
      product_tour_completed: true,
      product_tour_completed_at: new Date().toISOString(),
    };

    setProfileData(nextProfileData);

    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_data: nextProfileData }),
    });
  };

  return (
    <AuthGuard allowedRoles={allowedRoles}>
      <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-900">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 -translate-x-full transition-transform lg:static lg:translate-x-0",
            sidebarOpen && "translate-x-0"
          )}
        >
          <Sidebar role={role} companyName={companyName} onClose={() => setSidebarOpen(false)} />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar
            userEmail={email}
            userName={name}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
        <ProductTour
          role={role}
          open={tourOpen}
          onClose={() => setTourOpen(false)}
          onComplete={handleTourComplete}
        />
      </div>
    </AuthGuard>
  );
}
