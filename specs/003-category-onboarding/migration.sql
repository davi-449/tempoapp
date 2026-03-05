-- Parte 1 do Spec 003: Category Onboarding
-- Adiciona a coluna settings à tabela categories do Supabase.
-- Deverá comportar estruturas json do tipo: { isConfigured: true, daysOfWeek: [1, 3, 5], baseDurationMinutes: 60 }
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;