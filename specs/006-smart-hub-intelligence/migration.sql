-- Spec 006: Smart Hub Views + Completion Intelligence
-- Execute this in the Supabase SQL Editor (Lovable Dashboard)
-- Table for completion logs (workout metrics, study notes, etc)
CREATE TABLE IF NOT EXISTS public.task_completion_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    -- Universal fields
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    -- Workout-specific fields
    actual_duration_minutes INT,
    perceived_intensity INT CHECK (
        perceived_intensity BETWEEN 1 AND 5
    ),
    estimated_calories NUMERIC(6, 1),
    -- Metadata
    category TEXT,
    log_type TEXT DEFAULT 'general' CHECK (
        log_type IN ('general', 'study', 'workout', 'work')
    )
);
ALTER TABLE public.task_completion_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their completion logs" ON public.task_completion_logs FOR ALL USING (auth.uid() = user_id);