export type UserRole =
  | "super_admin"
  | "company_admin"
  | "hr"
  | "mentor"
  | "new_hire"
  | "leadership"
  | "it_security";

export interface Company {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  company_id?: string;
  full_name: string;
  avatar_url?: string;
  profile_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  company_id: string;
  title: string;
  description: string;
  assigned_to_user_id: string;
  assigned_by_user_id?: string;
  status: "pending" | "in_progress" | "completed" | "review";
  due_date?: string;
  completion_date?: string;
  feedback?: Record<string, unknown>;
  playground_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningPath {
  id: string;
  company_id: string;
  name: string;
  description: string;
  tasks: string[];
  created_at: string;
  updated_at: string;
}

export interface Playground {
  id: string;
  company_id: string;
  name: string;
  type: "code_review" | "email_simulation" | "debugging" | "general";
  configuration: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  company_id: string;
  title: string;
  content: string;
  uploaded_by_user_id: string;
  access_permissions: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PerformanceMetric {
  id: string;
  company_id: string;
  user_id: string;
  metric_type: string;
  score: number;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface Invite {
  id: string;
  company_id: string;
  email: string;
  role: UserRole;
  invited_by_user_id: string;
  token: string;
  accepted: boolean;
  expires_at: string;
  created_at: string;
}
