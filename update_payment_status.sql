-- 🎯 Actualizar la constraint de payment_status para permitir 'cancelled'
-- Ejecutar este query en Supabase SQL Editor

-- 1. Primero eliminar la constraint existente
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointments_payment_status_check;

-- 2. Crear la nueva constraint que incluye 'cancelled'
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_payment_status_check 
CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text]));

-- 3. Verificar que se aplicó correctamente
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.appointments'::regclass 
  AND conname = 'appointments_payment_status_check';

-- 4. Opcional: Actualizar citas existentes canceladas que tengan payment_status = 'pending'
UPDATE public.appointments 
SET payment_status = 'cancelled' 
WHERE status = 'cancelled' AND payment_status = 'pending';
