-- Workout Module Migration (002-workout-module)
-- 1. Add Workout fields to existing 'tasks' table
ALTER TABLE "public"."tasks"
ADD COLUMN IF NOT EXISTS "task_type" text DEFAULT 'task',
    ADD COLUMN IF NOT EXISTS "workout_type" text,
    ADD COLUMN IF NOT EXISTS "target_muscle_group" text,
    ADD COLUMN IF NOT EXISTS "intensity" text;
-- 2. Create 'subtasks' table for Exercises/Checklists
CREATE TABLE IF NOT EXISTS "public"."subtasks" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "task_id" uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    "title" text NOT NULL,
    "is_completed" boolean DEFAULT false,
    "order" smallint DEFAULT 0,
    "created_at" timestamptz DEFAULT now()
);
-- 3. Enable RLS on subtasks
ALTER TABLE "public"."subtasks" ENABLE ROW LEVEL SECURITY;
-- 4. Create Policies manually (safely checking existence)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'subtasks'
        AND policyname = 'Users can view subtasks of their tasks'
) THEN CREATE POLICY "Users can view subtasks of their tasks" ON public.subtasks FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.tasks
            WHERE tasks.id = subtasks.task_id
                AND tasks.user_id = auth.uid()
        )
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'subtasks'
        AND policyname = 'Users can insert subtasks to their tasks'
) THEN CREATE POLICY "Users can insert subtasks to their tasks" ON public.subtasks FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.tasks
            WHERE tasks.id = subtasks.task_id
                AND tasks.user_id = auth.uid()
        )
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'subtasks'
        AND policyname = 'Users can update subtasks of their tasks'
) THEN CREATE POLICY "Users can update subtasks of their tasks" ON public.subtasks FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.tasks
            WHERE tasks.id = subtasks.task_id
                AND tasks.user_id = auth.uid()
        )
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'subtasks'
        AND policyname = 'Users can delete subtasks of their tasks'
) THEN CREATE POLICY "Users can delete subtasks of their tasks" ON public.subtasks FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.tasks
        WHERE tasks.id = subtasks.task_id
            AND tasks.user_id = auth.uid()
    )
);
END IF;
END $$;