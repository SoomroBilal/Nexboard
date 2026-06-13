-- Nexboard Multi-Tenant Schema — Clean Version
-- Run this ONCE in Supabase SQL editor
--
-- Promote user to super admin (runs only if email exists in the system)
UPDATE public.profiles
SET role = 'super_admin', company_id = NULL
WHERE email = 'admin@nexboard.com'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE email = 'admin@nexboard.com');

-- ========== DROP EVERYTHING ==========
DROP TABLE IF EXISTS public.invites CASCADE;
DROP TABLE IF EXISTS public.performance_metrics CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.learning_paths CASCADE;
DROP TABLE IF EXISTS public.playgrounds CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Drop existing functions/triggers
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_company_id() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;

-- ========== ENUMS ==========
CREATE TYPE user_role AS ENUM ('super_admin', 'company_admin', 'hr', 'mentor', 'new_hire', 'leadership', 'it_security');

-- ========== COMPANIES ==========
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'new_hire'::user_role,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  avatar_url TEXT,
  profile_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== TASKS ==========
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by_user_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'review')),
  due_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  feedback JSONB DEFAULT '{}'::jsonb,
  playground_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== LEARNING PATHS ==========
CREATE TABLE public.learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  tasks UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== PLAYGROUNDS ==========
CREATE TABLE public.playgrounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('code_review', 'email_simulation', 'debugging', 'general')),
  configuration JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== DOCUMENTS ==========
CREATE TABLE public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  uploaded_by_user_id UUID REFERENCES public.profiles(id),
  access_permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== PERFORMANCE METRICS ==========
CREATE TABLE public.performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  score NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details JSONB DEFAULT '{}'::jsonb
);

-- ========== INVITES ==========
CREATE TABLE public.invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'new_hire'::user_role,
  invited_by_user_id UUID REFERENCES public.profiles(id),
  token TEXT UNIQUE NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== ENABLE RLS ==========
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- ========== AUTO-CREATE PROFILE TRIGGER ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, company_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'new_hire'::user_role),
    (NEW.raw_user_meta_data ->> 'company_id')::UUID
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========== UPDATED_AT TRIGGER ==========
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========== HELPER FUNCTIONS ==========
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_current_company_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ========== RLS POLICIES ==========

-- Profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.get_current_role() = 'super_admin');

CREATE POLICY "Company admins can view profiles in their company"
  ON public.profiles FOR SELECT
  USING (
    public.get_current_role() = 'company_admin'
    AND company_id = public.get_current_company_id()
  );

CREATE POLICY "Company admins can update profiles in their company"
  ON public.profiles FOR UPDATE
  USING (
    public.get_current_role() = 'company_admin'
    AND company_id = public.get_current_company_id()
  );

-- Tasks
CREATE POLICY "Users can view tasks in their company"
  ON public.tasks FOR SELECT
  USING (company_id = public.get_current_company_id());

CREATE POLICY "Users can view own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = assigned_to_user_id OR auth.uid() = assigned_by_user_id);

CREATE POLICY "Company admins and HR can insert tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    company_id = public.get_current_company_id()
    AND public.get_current_role() IN ('company_admin', 'hr', 'mentor')
  );

CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = assigned_to_user_id);

-- Documents
CREATE POLICY "Users can view documents in their company"
  ON public.documents FOR SELECT
  USING (company_id = public.get_current_company_id());

CREATE POLICY "Company admins and HR can manage documents"
  ON public.documents FOR INSERT
  WITH CHECK (
    company_id = public.get_current_company_id()
    AND public.get_current_role() IN ('company_admin', 'hr')
  );

-- Performance Metrics
CREATE POLICY "Users can view own metrics"
  ON public.performance_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Company admins and HR can view all metrics"
  ON public.performance_metrics FOR SELECT
  USING (
    company_id = public.get_current_company_id()
    AND public.get_current_role() IN ('company_admin', 'hr', 'mentor')
  );

-- Invites
CREATE POLICY "Company admins can manage invites"
  ON public.invites FOR ALL
  USING (
    company_id = public.get_current_company_id()
    AND public.get_current_role() IN ('company_admin', 'hr')
  );
