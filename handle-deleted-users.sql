-- 🆕 Funciones para manejar usuarios eliminados y sus citas
-- Este archivo contiene funciones útiles para gestionar el soft delete

-- Función para obtener todas las citas de un usuario eliminado
CREATE OR REPLACE FUNCTION get_appointments_for_deleted_user(user_id UUID)
RETURNS TABLE (
    appointment_id UUID,
    client_name TEXT,
    service_name TEXT,
    start_date_time TIMESTAMPTZ,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as appointment_id,
        c.name as client_name,
        s.name as service_name,
        a.start_date_time,
        a.status
    FROM appointments a
    LEFT JOIN clients c ON a.client_id = c.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE a.assigned_to = user_id
    ORDER BY a.start_date_time DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para reasignar todas las citas de un usuario a otro
CREATE OR REPLACE FUNCTION reassign_user_appointments(
    old_user_id UUID,
    new_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE appointments 
    SET assigned_to = new_user_id
    WHERE assigned_to = old_user_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar citas como "sin asignar" cuando se elimina un usuario
CREATE OR REPLACE FUNCTION mark_appointments_unassigned(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE appointments 
    SET assigned_to = NULL
    WHERE assigned_to = user_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Vista para ver usuarios eliminados y sus citas pendientes
CREATE OR REPLACE VIEW deleted_users_with_appointments AS
SELECT 
    up.id,
    up.name,
    up.role,
    up.created_at,
    up.status,
    COUNT(a.id) as pending_appointments
FROM user_profiles up
LEFT JOIN appointments a ON up.id = a.assigned_to AND a.status = 'pending'
WHERE up.status = 'deleted'
GROUP BY up.id, up.name, up.role, up.created_at, up.status;

-- Comentarios sobre el uso:
-- 1. Para ver citas de un usuario eliminado: SELECT * FROM get_appointments_for_deleted_user('user-id');
-- 2. Para reasignar citas: SELECT reassign_user_appointments('old-user-id', 'new-user-id');
-- 3. Para marcar citas como sin asignar: SELECT mark_appointments_unassigned('user-id');
-- 4. Para ver usuarios eliminados con citas: SELECT * FROM deleted_users_with_appointments;
