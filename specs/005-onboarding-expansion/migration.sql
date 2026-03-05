-- Migration: Add 'settings' JSONB column to 'categories' table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
-- Also ensure category_id exists on tasks for relational linking
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);