import type { UserRole } from "./types";

export const ROLES: Record<string, UserRole> = {
  SUPER_ADMIN: "super_admin",
  COMPANY_ADMIN: "company_admin",
  HR: "hr",
  MENTOR: "mentor",
  NEW_HIRE: "new_hire",
  LEADERSHIP: "leadership",
  IT_SECURITY: "it_security",
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  company_admin: "Company Admin",
  hr: "HR / L&D",
  mentor: "Mentor",
  new_hire: "New Hire",
  leadership: "Leadership",
  it_security: "IT / Security",
};

export const DASHBOARD_ROUTES: Record<UserRole, string> = {
  super_admin: "/dashboard/super-admin",
  company_admin: "/dashboard/admin",
  hr: "/dashboard/hr",
  mentor: "/dashboard/mentor",
  new_hire: "/dashboard/new-hire",
  leadership: "/dashboard/leadership",
  it_security: "/dashboard/it-security",
};

export const HUGGING_FACE_MODELS = {
  CHAT: "google/flan-t5-xxl",
  TASK_GENERATION: "gpt2",
  CODE_REVIEW: "codellama/CodeLlama-7b-hf",
  EMAIL_SIMULATION: "facebook/blenderbot-400M-distill",
  FEEDBACK: "bert-base-uncased",
  DOCUMENT_ANALYSIS: "impira/layoutlm-document-qa",
} as const;
