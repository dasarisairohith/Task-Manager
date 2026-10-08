-- ====================================================================
-- SUPABASE POSTGRESQL DATABASE MIGRATION
-- Secure RLS policies for Task Manager
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
    due_date TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id,email,full_name,avatar_url)
    VALUES (NEW.id,NEW.email,COALESCE(NEW.raw_user_meta_data->>'full_name',NEW.raw_user_meta_data->>'name',NEW.email),NEW.raw_user_meta_data->>'avatar_url')
    ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email,full_name=EXCLUDED.full_name,avatar_url=EXCLUDED.avatar_url,updated_at=NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at=NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow read access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow read access to comments" ON public.task_comments;
DROP POLICY IF EXISTS "Allow insert comments" ON public.task_comments;

CREATE POLICY "Authenticated users can read profiles" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid()=id) WITH CHECK (auth.uid()=id);

CREATE POLICY "Users can read related tasks" ON public.tasks FOR SELECT USING (auth.uid()=created_by OR auth.uid()=assigned_to);
CREATE POLICY "Users can create own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid()=created_by);
CREATE POLICY "Creators and assignees can update tasks" ON public.tasks FOR UPDATE USING (auth.uid()=created_by OR auth.uid()=assigned_to) WITH CHECK (auth.uid()=created_by OR auth.uid()=assigned_to);
CREATE POLICY "Only creators can delete tasks" ON public.tasks FOR DELETE USING (auth.uid()=created_by);

CREATE POLICY "Users can read related comments" ON public.task_comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tasks t WHERE t.id=task_id AND (t.created_by=auth.uid() OR t.assigned_to=auth.uid()))
);
CREATE POLICY "Related users can add comments" ON public.task_comments FOR INSERT WITH CHECK (
    auth.uid()=user_id AND EXISTS (SELECT 1 FROM public.tasks t WHERE t.id=task_id AND (t.created_by=auth.uid() OR t.assigned_to=auth.uid()))
);
