# 🎯 Estudio Maker - Sistema de Gestión para Salones

Un sistema completo de gestión para salones de belleza, barberías y spas con múltiples vistas especializadas y arquitectura moderna.

## 🚀 **Características Principales**

### **🗓️ Gestión de Citas Avanzada**
- **Vista semanal** con calendario interactivo
- **Vista diaria** con análisis de revenue
- **Citas recurrentes** con manejo de excepciones
- **Asignación automática** de empleados
- **Estados múltiples**: Pendiente, Completada, Cancelada

### **👥 Gestión de Clientes y Empleados**
- **Base de datos completa** de clientes
- **Perfiles de empleados** con horarios
- **Seguimiento de clientes** con recordatorios
- **Historial de servicios** por cliente

### **📊 Análisis y Reportes**
- **Métricas de revenue** en tiempo real
- **Análisis de tráfico** de clientes
- **Métricas de tiempo** y productividad
- **Estadísticas detalladas** del negocio

### **💰 Sistema de Pagos**
- **Múltiples métodos** de pago
- **Descuentos y promociones**
- **Estado de pagos** en tiempo real
- **Análisis de revenue** por período

### **🎯 Monitoreo de Competencia**
- **Scraping inteligente** de precios de competencia
- **Cache avanzado** con ETag, Last-Modified y Content Hash
- **Categorización automática** de servicios
- **Vista integrada** en navbar principal (solo admin)
- **Detección automática** de cambios en precios

## 🏗️ **Arquitectura Técnica**

### **Frontend**
- **Next.js 13+** con App Router
- **React 18+** con hooks modernos
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **React Big Calendar** para calendarios

### **Backend**
- **Supabase** como backend-as-a-service
- **PostgreSQL** para base de datos
- **Autenticación** integrada
- **Actualizaciones en tiempo real** con React Query y polling

### **Estado y Cache**
- **React Query** para gestión de estado del servidor
- **DataProvider centralizado** (single source of truth)
- **Cache inteligente** con invalidación selectiva
- **Loading states granulares**
- **Polling automático** para actualizaciones en tiempo real

## 📱 **Vistas del Sistema**

### **🗓️ Vistas de Calendario**
| Vista | Componente | Descripción |
|-------|------------|-------------|
| **Agenda** | `WeekView` | Vista semanal básica con gestión de citas |
| **Día** | `DailyRevenueView` | Vista diaria con análisis de revenue y pagos |

### **📊 Vistas de Análisis**
| Vista | Componente | Descripción |
|-------|------------|-------------|
| **Estadísticas** | `StatsView` | Métricas generales del negocio |
| **Tráfico** | `TrafficView` | Análisis de flujo de clientes |
| **Tiempo** | `TimeMetricsView` | Métricas de tiempo y productividad |

### **👥 Vistas de Gestión**
| Vista | Componente | Descripción |
|-------|------------|-------------|
| **Clientes** | `ClientsView` | Gestión completa de clientes |
| **Empleados** | `StaffManagementView` | Gestión de personal y horarios |
| **Seguimiento** | `FollowUpView` | Clientes que necesitan seguimiento |

### **💰 Vistas de Negocio**
| Vista | Componente | Descripción |
|-------|------------|-------------|
| **Precios** | `PriceView` | Gestión de precios y servicios |
| **Competencia** | `CompetitorsView` | Monitoreo de precios de competencia |

### **🔧 Vistas de Desarrollo**
| Vista | Componente | Descripción |
|-------|------------|-------------|
| **Dev Tools** | `DevTools` | Herramientas de desarrollo y debugging |

## 📚 **Documentación**

### **Monitoreo de Competencia**
- **[Flow del Scraper](./SCRAPER_FLOW.md)** - Diagrama visual del flujo de datos
- **[README Completo del Scraper](./COMPETITORS_SCRAPER_README.md)** - Documentación técnica detallada

## 🚀 **Inicio Rápido**

### **Prerrequisitos**
- Node.js 18+ 
- npm, yarn, pnpm o bun
- Cuenta de Supabase

### **Instalación**

```bash
# Clonar el repositorio
git clone <repository-url>
cd studio-maker

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Ejecutar en desarrollo
npm run dev
```

### **Configuración de Supabase**

1. Crear proyecto en [Supabase](https://supabase.com)
2. Ejecutar el script SQL en `supabase-query.sql`
3. Configurar las variables de entorno:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
   ```

## 🔧 **Uso del Sistema**

### **Flujo Principal**

1. **Iniciar sesión** con credenciales de empleado
2. **Navegar entre vistas** usando la barra de navegación
3. **Crear citas** desde cualquier vista de calendario
4. **Gestionar clientes** desde la vista de Clientes
5. **Analizar métricas** desde las vistas de análisis

### **Gestión de Citas**

- **Crear cita**: Hacer clic en slot vacío del calendario
- **Editar cita**: Hacer clic en evento existente
- **Cancelar cita**: Cambiar estado a "Cancelada"
- **Citas recurrentes**: Configurar en formulario de cita

### **Análisis de Datos**

- **Revenue diario**: Vista "Día"
- **Métricas generales**: Vista "Estadísticas"
- **Flujo de clientes**: Vista "Tráfico"
- **Productividad**: Vista "Tiempo"

## 🛠️ **Herramientas de Desarrollo**

### **DevTools**
- **Acceso**: Botón "Dev" en navegación (solo en desarrollo)
- **Funciones**:
  - Seed de datos de prueba
  - Reset de base de datos
  - Export/Import de datos
  - Debug del DataProvider

### **Debug del DataProvider**
- **Panel flotante**: Botón azul en esquina inferior derecha
- **Información**:
  - Estados de loading en tiempo real
  - Errores específicos
  - Contadores de datos
  - Retry de queries fallidas

## 📊 **Arquitectura de Datos**

### **DataProvider Centralizado**
- **Single source of truth** para toda la aplicación
- **Cache inteligente** con React Query
- **Loading states granulares**
- **Manejo robusto de errores**

### **Categorías de Datos**
- **Core**: Citas, clientes, servicios (crítico)
- **Staff**: Empleados, horarios (importante)
- **Realtime**: Walk-ins, ocurrencias del día (dinámico)
- **Analytics**: Ocurrencias semanales/mensuales (opcional)

## 🔒 **Autenticación y Seguridad**

- **Autenticación** con Supabase Auth
- **Roles**: Admin, Staff, Sin asignar
- **Protección de rutas** con `ProtectedRoute`
- **Validación de permisos** por vista

## 📱 **Responsive Design**

- **Mobile-first** con Tailwind CSS
- **Breakpoints**: sm, md, lg, xl
- **Navegación adaptativa** para móviles
- **Calendario responsive** en todas las vistas

## 🚀 **Despliegue**

### **Vercel (Recomendado)**
```bash
# Conectar repositorio a Vercel
# Configurar variables de entorno
# Deploy automático en push
```

### **Otros Proveedores**
- **Netlify**: Compatible con Next.js
- **Railway**: Soporte para Node.js
- **DigitalOcean**: App Platform

## 📈 **Métricas de Rendimiento**

### **Optimizaciones Implementadas**
- **DataProvider centralizado**: Reduce requests de 645 a 8-12 por carga
- **Cache inteligente**: 85-95% cache hits
- **Loading states granulares**: Mejor UX
- **Invalidación selectiva**: Re-renders optimizados

### **Tiempos de Carga**
- **Carga inicial**: 0.5-1 segundo
- **Navegación entre vistas**: Instantánea
- **Actualización de datos**: 200-500ms

## 🤝 **Contribución**

### **Estructura del Proyecto**
```
src/
├── app/
│   ├── components/     # Componentes de vista
│   ├── context/       # Contextos (DataProvider, Auth)
│   └── layout.tsx     # Layout principal
├── lib/
│   ├── queries.ts     # React Query hooks
│   ├── supabase.ts    # Configuración de Supabase
│   └── db.ts          # Funciones de base de datos
```

### **Convenciones**
- **TypeScript** para todos los archivos
- **Tailwind CSS** para estilos
- **React Query** para estado del servidor
- **Luxon** para manejo de fechas

## 📝 **Notas de Desarrollo**

### **Drag & Drop**
- **Estado**: Temporalmente deshabilitado por error de JSX transform
- **Plan**: Implementar solución alternativa en futura iteración
- **Funcionalidad**: Edición por clic funciona perfectamente

### **DataProvider**
- **Documentación completa**: Ver `DATA_PROVIDER_README.md`
- **Migración**: 100% de componentes principales migrados
- **Performance**: Optimizado para producción

## 📞 **Soporte**

- **Issues**: Crear issue en GitHub
- **Documentación**: README y `DATA_PROVIDER_README.md`
- **Debug**: Panel de debug integrado en desarrollo

---

## 🎯 **Roadmap**

### **Próximas Funcionalidades**
- [ ] Drag & drop de citas (solución alternativa)
- [ ] Notificaciones push
- [ ] App móvil nativa
- [ ] Integración con WhatsApp
- [ ] Sistema de fidelización

### **Optimizaciones Pendientes**
- [ ] PWA (Progressive Web App)
- [ ] Offline support
- [ ] Background sync
- [ ] Lazy loading avanzado

---

**Estudio Maker** - Sistema completo de gestión para salones de belleza 🎯
