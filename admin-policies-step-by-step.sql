-- 🆕 Script paso a paso para configurar políticas de administración
-- Ejecutar cada sección por separado para evitar conflictos

-- ========================================
-- PASO 1: Eliminar políticas existentes
-- ========================================
-- Ejecutar esta sección primero

DROP POLICY IF EXISTS "Users can view their profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can create user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Only admins can create profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Only admins can update profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Only admins can soft delete profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view active profiles" ON public.user_profiles;

-- ========================================
-- PASO 2: Agregar campo de estado
-- ========================================
-- Ejecutar esta sección después del paso 1

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted'));

-- ========================================
-- PASO 3: Crear nuevas políticas
-- ========================================
-- Ejecutar esta sección después del paso 2

-- Política para ver perfiles activos
CREATE POLICY "Authenticated users can view active profiles" ON public.user_profiles
    FOR SELECT USING (auth.role() = 'authenticated' AND status = 'active');

-- Política para crear perfiles (solo admins)
CREATE POLICY "Only admins can create profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
        )
    );

-- Política para actualizar perfiles (solo admins)
CREATE POLICY "Only admins can update profiles" ON public.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
        )
    );

-- Política para soft delete (solo admins)
CREATE POLICY "Only admins can soft delete profiles" ON public.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
        )
    );

-- ========================================
-- PASO 4: Verificar configuración
-- ========================================
-- Ejecutar esta sección para verificar que todo esté correcto

-- Verificar que el campo status existe
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'status';

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Verificar usuarios activos
SELECT id, name, role, status, created_at 
FROM user_profiles 
WHERE status = 'active' 
ORDER BY created_at DESC;
