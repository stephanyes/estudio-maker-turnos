-- 🆕 Script para verificar si el campo status existe en user_profiles
-- Ejecutar en Supabase SQL Editor

-- Verificar si el campo status existe
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'status';

-- Si no existe, agregarlo
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted'));

-- Verificar los datos actuales
SELECT id, name, role, status, created_at 
FROM user_profiles 
ORDER BY created_at DESC;

-- Actualizar registros existentes que no tengan status
UPDATE public.user_profiles 
SET status = 'active' 
WHERE status IS NULL;
