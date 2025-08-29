# 🎯 Dashboard de Administración - Studio Maker

## **Descripción**

Se ha implementado un dashboard de administración completo que permite a los administradores gestionar usuarios del sistema de manera segura y eficiente.

## **🚀 Características Implementadas**

### **Gestión de Usuarios**
- ✅ **Crear usuarios**: Los administradores pueden crear nuevos usuarios (staff o admin)
- ✅ **Editar usuarios**: Modificar nombres y roles de usuarios existentes
- ✅ **Cambiar roles**: Promover/degradar usuarios entre staff y admin
- ✅ **Eliminar usuarios**: Eliminar usuarios del sistema (con confirmación)
- ✅ **Lista de usuarios**: Vista completa de todos los usuarios del sistema

### **Seguridad**
- ✅ **Control de acceso**: Solo administradores pueden acceder al dashboard
- ✅ **Verificación de permisos**: Todas las operaciones verifican el rol del usuario
- ✅ **Protección de cuenta propia**: Los usuarios no pueden modificar/eliminar su propia cuenta
- ✅ **Políticas RLS**: Base de datos protegida con Row Level Security

## **📋 Requisitos Previos**

### **Base de Datos**
- Ejecutar las políticas SQL en `admin-policies.sql` en Supabase
- Verificar que la tabla `user_profiles` tenga los campos correctos

### **Configuración de Supabase**
- Habilitar Row Level Security (RLS) en la tabla `user_profiles`
- Configurar las políticas de seguridad necesarias

## **🔧 Instalación**

### **1. Ejecutar Políticas SQL**
```sql
-- Ejecutar en Supabase SQL Editor
-- Ver archivo: admin-policies.sql
```

### **2. Verificar Componentes**
- ✅ `AdminDashboard.tsx` - Componente principal
- ✅ `AuthContext.tsx` - Funciones de administración
- ✅ `page.tsx` - Integración en navegación

### **3. Verificar Permisos**
El sistema ya incluye el permiso `canAccessAdmin` que se otorga automáticamente a usuarios con rol `admin`.

## **🎮 Uso del Dashboard**

### **Acceso**
1. Iniciar sesión como administrador
2. Hacer clic en el botón "Admin" en la barra de navegación
3. El dashboard solo será visible para usuarios con rol `admin`

### **Vista de Usuarios Activos**
- **Sección superior**: Muestra todos los usuarios activos del sistema
- **Acciones disponibles**: Editar, cambiar rol, eliminar
- **Información visible**: Nombre, rol, fecha de creación, estado

### **Vista de Usuarios Eliminados**
- **Sección inferior**: Muestra usuarios marcados como eliminados
- **Acciones disponibles**: Reactivar usuario
- **Información visible**: Nombre (tachado), rol, estado "Eliminado"
- **Botón "Mostrar/Ocultar"**: Para expandir o contraer la sección

### **Crear Usuario**
1. Hacer clic en "Crear Usuario"
2. Completar formulario:
   - Nombre completo
   - Email
   - Contraseña (mínimo 6 caracteres)
   - Rol (staff o admin)
3. Hacer clic en "Crear Usuario"

### **Editar Usuario**
1. Hacer clic en el ícono de edición (✏️) junto al usuario
2. Modificar nombre y/o rol
3. Hacer clic en "Actualizar Usuario"

### **Cambiar Rol**
1. Usar el selector de rol directamente en la lista
2. El cambio se aplica inmediatamente

### **Eliminar Usuario**
1. Hacer clic en el ícono de eliminar (🗑️)
2. Confirmar la acción
3. El usuario se marca como "eliminado" (soft delete)

### **Reactivar Usuario**
1. En la sección "Usuarios Eliminados", hacer clic en "Mostrar"
2. Hacer clic en el ícono de reactivar (🔄)
3. Confirmar la acción
4. El usuario vuelve a aparecer en "Usuarios Activos"

## **🔒 Seguridad Implementada**

### **Verificaciones de Permisos**
- Solo administradores pueden acceder al dashboard
- Solo administradores pueden crear/editar/eliminar usuarios
- Los usuarios no pueden modificar su propia cuenta desde el dashboard

### **Políticas de Base de Datos**
- **SELECT**: Solo admins ven todos los perfiles, usuarios normales solo ven el suyo
- **INSERT**: Solo admins pueden crear perfiles
- **UPDATE**: Solo admins pueden actualizar perfiles
- **DELETE**: Solo admins pueden eliminar perfiles

### **Validaciones del Frontend**
- Verificación de rol antes de cada operación
- Confirmación para acciones destructivas
- Manejo de errores y mensajes de estado

## **🔄 Soft Delete - Gestión de Usuarios Eliminados**

### **¿Qué es Soft Delete?**
En lugar de eliminar físicamente los usuarios de la base de datos, se marcan como `status = 'deleted'`. Esto preserva:
- ✅ **Historial de citas** del usuario
- ✅ **Integridad referencial** con otras tablas
- ✅ **Posibilidad de recuperación** si es necesario
- ✅ **Auditoría completa** del sistema

### **Estados de Usuario**
- **`active`**: Usuario activo y disponible
- **`inactive`**: Usuario temporalmente deshabilitado
- **`deleted`**: Usuario eliminado (soft delete)

### **Manejo de Citas de Usuarios Eliminados**
Cuando se elimina un usuario con citas asignadas:

1. **El usuario se marca como `deleted`**
2. **Las citas permanecen asignadas** al usuario eliminado
3. **Se pueden reasignar** usando las funciones SQL proporcionadas
4. **Se pueden marcar como "sin asignar"** si es necesario

### **Funciones SQL Disponibles**
Ejecuta `handle-deleted-users.sql` para obtener funciones útiles:
- `get_appointments_for_deleted_user()` - Ver citas de usuario eliminado
- `reassign_user_appointments()` - Reasignar citas a otro usuario
- `mark_appointments_unassigned()` - Marcar citas como sin asignar
- `deleted_users_with_appointments` - Vista de usuarios eliminados con citas

## **🐛 Solución de Problemas**

### **Error: "policy already exists"**
- **Causa**: Las políticas ya existen en la base de datos
- **Solución**: Usar `admin-policies-step-by-step.sql` y ejecutar cada sección por separado
- **Alternativa**: Ejecutar manualmente los DROP POLICY antes de CREATE POLICY

### **Error: "Solo los administradores pueden..."**
- Verificar que el usuario tenga rol `admin`
- Verificar que las políticas SQL estén ejecutadas
- Recargar la página después de cambios de rol

### **Error: "No se pueden crear usuarios"**
- Verificar permisos de Supabase Auth
- Verificar que `email_confirm: true` esté configurado
- Verificar conexión a la base de datos

### **Error: "infinite recursion detected in policy"**
- Ejecutar el SQL corregido en `admin-policies.sql`
- Las políticas originales causaban recursión infinita
- La versión corregida evita este problema

### **Error al eliminar usuarios (409 Conflict)**
- **Causa**: Usuario tiene citas asignadas (foreign key constraint)
- **Solución**: Implementado soft delete - usuarios se marcan como `deleted` pero no se eliminan físicamente
- **Resultado**: Las citas se preservan y la integridad de la base de datos se mantiene

### **Dashboard no visible**
- Verificar que el usuario tenga rol `admin`
- Verificar que `canAccessAdmin` esté en los permisos
- Verificar que el componente esté importado correctamente

## **📱 Responsive Design**

El dashboard está completamente optimizado para:
- ✅ **Desktop**: Vista completa con todas las funcionalidades
- ✅ **Tablet**: Adaptación automática del layout
- ✅ **Mobile**: Navegación táctil y modales responsivos

## **🎨 Personalización**

### **Colores y Temas**
- Soporte completo para modo claro/oscuro
- Colores consistentes con el resto de la aplicación
- Iconos de Lucide React para consistencia visual

### **Idioma**
- Interfaz en español
- Fechas en formato argentino
- Mensajes de error y éxito localizados

## **🔮 Próximas Mejoras**

### **Funcionalidades Futuras**
- [ ] Historial de cambios de rol
- [ ] Logs de actividad de administradores
- [ ] Importación masiva de usuarios
- [ ] Plantillas de usuarios por rol
- [ ] Notificaciones por email al crear usuarios

### **Mejoras de UX**
- [ ] Búsqueda y filtrado de usuarios
- [ ] Paginación para listas grandes
- [ ] Exportación de lista de usuarios
- [ ] Drag & drop para reordenar usuarios

## **📞 Soporte**

Para problemas o mejoras:
1. Verificar logs de consola del navegador
2. Verificar logs de Supabase
3. Revisar políticas de seguridad
4. Verificar permisos de usuario

---

**🎯 Dashboard de Administración implementado exitosamente en Studio Maker!**
