import { Client } from 'pg';

const connectionString = 'postgresql://postgres:Mktfunil8563*@db.vowdhbiwkoaukxmmkmfk.supabase.co:5432/postgres';

const query = `
-- Drop existing tables if needed for a clean run (uncomment if necessary, but we use IF NOT EXISTS)
-- DROP TABLE IF EXISTS public.tasks CASCADE;
-- DROP TABLE IF EXISTS public.routines CASCADE;
-- DROP TABLE IF EXISTS public.projects CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY, -- Will link to auth.users in Supabase manually if needed, or by auth helper
  display_name TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Note: We assume auth.uid() function is present as standard in Supabase
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" 
        ON public.users FOR SELECT 
        USING ( auth.uid() = id );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" 
        ON public.users FOR UPDATE 
        USING ( auth.uid() = id );
    END IF;
END
$$;


-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can manage own projects'
    ) THEN
        CREATE POLICY "Users can manage own projects"
        ON public.projects FOR ALL
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Create routines table
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('trabalho', 'faculdade', 'pessoal', 'treino')),
  estimated_duration_minutes INTEGER,
  recurrence_rules JSONB,
  last_session_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'routines' AND policyname = 'Users can manage own routines'
    ) THEN
        CREATE POLICY "Users can manage own routines"
        ON public.routines FOR ALL
        USING (auth.uid() = user_id);
    END IF;
END
$$;


-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  routine_id UUID REFERENCES public.routines(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('trabalho', 'faculdade', 'pessoal', 'treino')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  location TEXT,
  estimated_duration_minutes INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can manage own tasks'
    ) THEN
        CREATE POLICY "Users can manage own tasks"
        ON public.tasks FOR ALL
        USING (auth.uid() = user_id);
    END IF;
END
$$;

`;

async function run() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL.");
    await client.query(query);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Failed to execute migration:", err);
  } finally {
    await client.end();
  }
}

run();
