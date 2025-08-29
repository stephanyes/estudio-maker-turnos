-- 🆕 Políticas de seguridad para el dashboard de administración
-- Este archivo debe ejecutarse en Supabase para habilitar la gestión de usuarios

-- Primero, eliminar TODAS las políticas existentes que pueden causar conflictos
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

-- 🆕 Agregar campo de estado para soft delete
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted'));

-- Política simplificada: permitir que todos los usuarios autenticados vean perfiles activos
-- (esto es necesario para que el dashboard de admin funcione)
CREATE POLICY "Authenticated users can view active profiles" ON public.user_profiles
    FOR SELECT USING (auth.role() = 'authenticated' AND status = 'active');

-- Política para que solo los administradores puedan crear perfiles
CREATE POLICY "Only admins can create profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
        )
    );

-- Política para que solo los administradores puedan actualizar perfiles
CREATE POLICY "Only admins can update profiles" ON public.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
        )
    );

-- Política para que solo los administradores puedan hacer soft delete
CREATE POLICY "Only admins can soft delete profiles" ON public.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
        )
    );

-- Comentario: Esta configuración permite soft delete en lugar de eliminación física
-- Los usuarios "eliminados" se marcan como status = 'deleted' pero permanecen en la base de datos
-- para mantener la integridad referencial con las citas y otros datos relacionados.
