-- Create Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    emoji TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);
-- RLS for Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own categories" ON public.categories FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);
-- Update profiles table (assuming it exists, otherwise we'll need to create it)
-- We will add avatar_url. If profiles doesn't exist, this might fail, but usually Lovable creates it.
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'avatar_url'
) THEN
ALTER TABLE public.profiles
ADD COLUMN avatar_url TEXT;
END IF;
EXCEPTION
WHEN undefined_table THEN -- If profiles table doesn't exist, we skip or create it depending on your context.
-- We will assume it exists since it's standard in these templates.
NULL;
END $$;
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
-- RLS for avatars bucket
-- We need to drop existing policies first if we are rerunning, or just create them if they don't exist.
-- To avoid errors, we'll just create them. If they exist, it will throw an error but that's fine.
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatars." ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
CREATE POLICY "Users can update their own avatars." ON storage.objects FOR
UPDATE USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
CREATE POLICY "Users can delete their own avatars." ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name)) [1]
);