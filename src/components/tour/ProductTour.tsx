"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { UserRole } from "@/lib/types";

type TourStep = {
  title: string;
  description: string;
  href?: string;
  hrefLabel?: string;
};

const ROLE_TOURS: Record<UserRole, TourStep[]> = {
  super_admin: [
    { title: "Platform Overview", description: "Manage companies, users, and global automation from the Super Admin dashboard." },
    { title: "Company Operations", description: "Use the Companies tab to create, suspend, activate, or delete tenants.", href: "/dashboard/super-admin?tab=companies", hrefLabel: "Open Companies" },
    { title: "Automation Controls", description: "Run onboarding and digest jobs from the dashboard automation tools.", href: "/dashboard/super-admin", hrefLabel: "Open Automation" },
  ],
  company_admin: [
    { title: "Company Admin Overview", description: "You can manage users, invites, programs, and tasks for your organization." },
    { title: "User and Invite Management", description: "Invite teammates, resend/revoke invites, and assign roles.", href: "/admin/users", hrefLabel: "Open Users" },
    { title: "Onboarding Programs", description: "Create and assign onboarding programs with optional AI task generation.", href: "/admin/programs", hrefLabel: "Open Programs" },
  ],
  hr: [
    { title: "HR Dashboard Overview", description: "Track onboarding progress, content readiness, and new-hire status." },
    { title: "Program Operations", description: "Create role-based onboarding programs and assign them to employees.", href: "/admin/programs", hrefLabel: "Open Programs" },
    { title: "Task Monitoring", description: "Review and manage onboarding tasks across your company.", href: "/admin/tasks", hrefLabel: "Open Tasks" },
  ],
  mentor: [
    { title: "Mentor Overview", description: "Track mentee progress, provide feedback, and manage review queues." },
    { title: "Review Queue", description: "Handle new-hire task submissions and publish actionable feedback.", href: "/dashboard/mentor/reviews", hrefLabel: "Open Reviews" },
    { title: "Communication Hub", description: "Use chat and meeting requests to support mentees in real time.", href: "/dashboard/mentor/communication", hrefLabel: "Open Communication" },
  ],
  new_hire: [
    { title: "Welcome to Nexboard", description: "Your dashboard tracks readiness, blockers, and active onboarding tasks." },
    { title: "Task Submission", description: "Submit completed work for mentor review and track feedback history.", href: "/dashboard/new-hire/tasks", hrefLabel: "Open Tasks" },
    { title: "Mentor Communication", description: "Chat with mentors and request meetings from your communication panel.", href: "/dashboard/new-hire/communication", hrefLabel: "Open Communication" },
  ],
  leadership: [
    { title: "Leadership Snapshot", description: "View workforce readiness and company onboarding health at a glance." },
    { title: "Strategic Reporting", description: "Use leadership reports to monitor trends and risks.", href: "/reports/leadership", hrefLabel: "Open Leadership Reports" },
    { title: "Analytics Views", description: "Review role and talent insights to plan next hiring and onboarding cycles.", href: "/dashboard/leadership", hrefLabel: "Open Leadership Dashboard" },
  ],
  it_security: [
    { title: "IT/Security Overview", description: "Monitor onboarding security posture and integration readiness." },
    { title: "Security Monitoring", description: "Track compliance and operational signals in the monitoring view.", href: "/dashboard/it-security", hrefLabel: "Open IT/Security Dashboard" },
    { title: "Technical Reports", description: "Use dedicated reports for security and platform review.", href: "/reports/it-security", hrefLabel: "Open IT/Security Reports" },
  ],
};

export function ProductTour({
  role,
  open,
  onClose,
  onComplete,
}: {
  role: UserRole;
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = useMemo(() => ROLE_TOURS[role] ?? ROLE_TOURS.new_hire, [role]);
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const handleClose = () => {
    setStepIndex(0);
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      setStepIndex(0);
      onComplete();
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  return (
    <Modal open={open} onClose={handleClose} title={`Quick Tour: ${role.replace("_", " ")}`}>
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-zinc-500">Step {stepIndex + 1} of {steps.length}</p>
          <h3 className="text-base font-semibold">{step.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{step.description}</p>
          {step.href && (
            <Link href={step.href}>
              <Button variant="outline" size="sm">{step.hrefLabel || "Open"}</Button>
            </Link>
          )}
        </div>
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={stepIndex === 0}
          >
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={handleClose}>Skip</Button>
            <Button type="button" onClick={handleNext}>{isLast ? "Finish" : "Next"}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
