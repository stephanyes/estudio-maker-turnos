-- 🆕 ACTUALIZACIÓN DE ESQUEMA PARA SERVICIOS MANUALES
-- Fecha: 2025-01-02
-- Propósito: Permitir servicios manuales sin serviceId

-- 1️⃣ Agregar columna service_name
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS service_name TEXT;

-- 2️⃣ Modificar service_id para permitir NULL
ALTER TABLE public.appointments 
ALTER COLUMN service_id DROP NOT NULL;

-- 3️⃣ Agregar comentario explicativo
COMMENT ON COLUMN public.appointments.service_name IS 'Nombre del servicio cuando se ingresa manualmente (sin serviceId)';
COMMENT ON COLUMN public.appointments.service_id IS 'ID del servicio del sistema (NULL para servicios manuales)';

-- 4️⃣ Crear índice para búsquedas por nombre de servicio
CREATE INDEX IF NOT EXISTS idx_appointments_service_name 
ON public.appointments(service_name) 
WHERE service_name IS NOT NULL;

-- 5️⃣ Verificar cambios
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
  AND column_name IN ('service_id', 'service_name')
ORDER BY column_name;
