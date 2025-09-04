import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  db,
  Client,
  Service,
  Appointment,
  getDailyTraffic,
  getDailyRevenue,
  UserProfile,
  StaffSchedule,
  calculateActualDuration,
  getAvailableStaff
} from './supabase-db';
import { getClientStats, getClientsAtRisk, markReminderSent } from './client-tracking';
import { getOccurrences } from '@/lib/schedule';
import { startOfWeekISO, endOfWeekISO } from '@/lib/time';
import { DateTime } from 'luxon';
import { Occ } from '@/app/components/WeekView';


// Keys para caché organizadas
export const queryKeys = {
  clients: ['clients'] as const,
  services: ['services'] as const,
  appointments: ['appointments'] as const,
  exceptions: ['exceptions'] as const,
  clientStats: ['clientStats'] as const,
  userProfiles: ['userProfiles'] as const,
  staffSchedules: ['staffSchedules'] as const,
  clientsAtRisk: (days: number) => ['clientsAtRisk', days] as const,
  clientHistory: (clientId: string) => ['clientHistory', clientId] as const,
  monthlyStats: (year: number, month: number) => ['monthlyStats', year, month] as const,
  monthlyTopServices: (year: number, month: number) => ['monthlyTopServices', year, month] as const,
  dailyTraffic: (date: string) => ['dailyTraffic', date] as const,
  dailyRevenue: (date: string) => ['dailyRevenue', date] as const,
  staffSchedulesByUser: (userId: string) => ['staffSchedulesByUser', userId] as const,
  availableStaff: (dayOfWeek: number, time: string) => ['availableStaff', dayOfWeek, time] as const,
  timeMetrics: (period: string) => ['timeMetrics', period] as const,
} as const;

// CLIENTS
export function useClients() {
  return useQuery({
    queryKey: queryKeys.clients,
    queryFn: () => db.clients.toArray(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useClientById(id: string) {
  return useQuery({
    queryKey: [...queryKeys.clients, id],
    queryFn: () => db.clients.get(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (client: Omit<Client, 'id'>) => db.clients.add(client),
    onSuccess: () => {
      // Invalidación optimizada - solo invalidar clients
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<Client> }) => 
      db.clients.update(id, changes),
    onSuccess: () => {
      // Invalidación optimizada - invalidar clients y stats si es necesario
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientStats });
    },
  });
}

// SERVICES
export function useServices() {
  return useQuery({
    queryKey: queryKeys.services,
    queryFn: () => db.services.toArray(),
    staleTime: 10 * 60 * 1000, // 10 minutos - los servicios cambian poco
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (service: Omit<Service, 'id'>) => db.services.add(service),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<Service> }) => 
      db.services.update(id, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.services.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services });
    },
  });
}

// APPOINTMENTS
export function useAppointments() {
  return useQuery({
    queryKey: queryKeys.appointments,
    queryFn: () => db.appointments.toArray(),
    staleTime: 2 * 60 * 1000, // 2 minutos - optimizado
  });
}

export function useAppointmentsByDateRange(startISO: string, endISO: string) {
  return useQuery({
    queryKey: ['appointments', 'range', startISO, endISO],
    queryFn: () => db.appointments.where('startDateTime').between(startISO, endISO).toArray(),
    staleTime: 2 * 60 * 1000, // 2 minutos - optimizado
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointment: Omit<Appointment, 'id'>) => db.appointments.add(appointment),
    onSuccess: () => {
      // Invalidación optimizada - invalidar solo lo necesario
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'range'] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, appointment }: { id?: string; appointment: Appointment }) => {
      if (id || appointment.id) {
        return db.appointments.put(appointment);
      }
      throw new Error('No appointment ID provided');
    },
    onSuccess: () => {
      // Invalidación optimizada - invalidar solo lo necesario
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'range'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientStats }); // por si cambia el status
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.appointments.delete(id),
    onSuccess: () => {
      // Invalidación optimizada - invalidar solo lo necesario
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'range'] });
    },
  });
}

// EXCEPTIONS
export function useExceptions() {
  return useQuery({
    queryKey: queryKeys.exceptions,
    queryFn: () => db.exceptions.toArray(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exception: Omit<import('./supabase-db').Exception, 'id'>) => 
      db.exceptions.add(exception),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exceptions });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'range'] }); // afecta ocurrencias
    },
  });
}

// CLIENT STATS & ANALYTICS
export function useClientStats() {
  return useQuery({
    queryKey: queryKeys.clientStats,
    queryFn: getClientStats,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useClientsAtRisk(daysSinceLastVisit: number = 30) {
  return useQuery({
    queryKey: queryKeys.clientsAtRisk(daysSinceLastVisit),
    queryFn: () => getClientsAtRisk(daysSinceLastVisit),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// COMBINED HOOKS para vistas complejas
export function useServicePriceMap() {
  const { data: services = [] } = useServices();
  return services.reduce((map, service) => {
    map[service.id] = { name: service.name, price: service.price };
    return map;
  }, {} as Record<string, { name: string; price: number }>);
}

export function useClientMap() {
  const { data: clients = [] } = useClients();
  return clients.reduce((map, client) => {
    map[client.id] = client;
    return map;
  }, {} as Record<string, Client>);
}

// BULK OPERATIONS para seed/reset
export function useResetData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await db.clientHistory.clear();
      await db.exceptions.clear();
      await db.appointments.clear();
      await db.services.clear();
      await db.clients.clear();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(); // invalida todo
    },
  });
}

// Hook para estadísticas mensuales (ingresos y count)
export function useMonthlyStats(year: number, month: number) {
  return useQuery({
    queryKey: queryKeys.monthlyStats(year, month),
    queryFn: async () => {
      const start = new Date(year, month - 1, 1).toISOString();
      const end = new Date(year, month, 0, 23, 59, 59).toISOString();

      const occs = await getOccurrences(start, end);
      const services = await db.services.toArray();

      const serviceMap: Record<string, { name: string; price: number }> = {};
      services.forEach(s => {
        serviceMap[s.id] = { name: s.name, price: s.price };
      });

      let totalIncome = 0;
      let completedCount = 0;

      occs.forEach(o => {
        if (o.status === 'done') {
          const svc = serviceMap[o.serviceId];
          if (svc) {
            totalIncome += svc.price;
            completedCount++;
          }
        }
      });

      return {
        income: totalIncome,
        count: completedCount
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    // Para meses pasados, cachear más tiempo
    gcTime: year < new Date().getFullYear() || 
           (year === new Date().getFullYear() && month < new Date().getMonth() + 1) 
           ? 24 * 60 * 60 * 1000 // 24 horas para meses pasados
           : 10 * 60 * 1000, // 10 minutos para mes actual
  });
}

// Hook para top servicios por mes
export function useMonthlyTopServices(year: number, month: number) {
  return useQuery({
    queryKey: queryKeys.monthlyTopServices(year, month),
    queryFn: async () => {
      const start = new Date(year, month - 1, 1).toISOString();
      const end = new Date(year, month, 0, 23, 59, 59).toISOString();

      const occs = await getOccurrences(start, end);
      const services = await db.services.toArray();

      const serviceMap: Record<string, { name: string; price: number }> = {};
      services.forEach(s => {
        serviceMap[s.id] = { name: s.name, price: s.price };
      });

      const serviceStats: Record<string, number> = {};

      occs.forEach(o => {
        if (o.status === 'done') {
          const svc = serviceMap[o.serviceId];
          if (svc) {
            serviceStats[svc.name] = (serviceStats[svc.name] ?? 0) + svc.price;
          }
        }
      });

      return Object.entries(serviceStats)
        .map(([service, total]) => ({ service, total }))
        .sort((a, b) => b.total - a.total);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: year < new Date().getFullYear() || 
           (year === new Date().getFullYear() && month < new Date().getMonth() + 1) 
           ? 24 * 60 * 60 * 1000 // 24 horas para meses pasados
           : 10 * 60 * 1000, // 10 minutos para mes actual
  });
}

// Hook para invalidar estadísticas cuando hay cambios en appointments
export function useUpdateAppointmentWithStats() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, appointment }: { id?: string; appointment: Appointment }) => {
      if (id || appointment.id) {
        return db.appointments.put(appointment);
      }
      throw new Error('No appointment ID provided');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'range'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientStats });
      
      // Invalidar estadísticas mensuales del mes afectado
      const appointmentDate = new Date(variables.appointment.startDateTime);
      const year = appointmentDate.getFullYear();
      const month = appointmentDate.getMonth() + 1;
      
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyStats(year, month) });
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTopServices(year, month) });
    },
  });
}

// STATS BAR - hooks para estadísticas rápidas
export function useTodayAppointments() {
  return useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: async () => {
      const now = DateTime.now();
      return await getOccurrences(
        now.startOf('day').toISO()!, 
        now.endOf('day').toISO()!
      );
    },
    staleTime: 2 * 60 * 1000, // 2 minutos - se actualiza frecuentemente
    select: (data) => data.length, // Solo retorna el count
  });
}

export function useWeekAppointments() {
  return useQuery({
    queryKey: ['appointments', 'week'],
    queryFn: async () => {
      const now = DateTime.now();
      return await getOccurrences(
        now.startOf('week').toISO()!, 
        now.endOf('week').toISO()!
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    select: (data) => data.length,
  });
}

export function useMonthAppointments() {
  return useQuery({
    queryKey: ['appointments', 'month'],
    queryFn: async () => {
      const now = DateTime.now();
      return await getOccurrences(
        now.startOf('month').toISO()!, 
        now.endOf('month').toISO()!
      );
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    select: (data) => data.length,
  });
}

// Hook combinado para usar en StatsBar
export function useStatsBarData() {
  const todayQuery = useTodayAppointments();
  const weekQuery = useWeekAppointments();
  const monthQuery = useMonthAppointments();

  return {
    today: todayQuery.data ?? 0,
    week: weekQuery.data ?? 0,
    month: monthQuery.data ?? 0,
    isLoading: todayQuery.isLoading || weekQuery.isLoading || monthQuery.isLoading,
    error: todayQuery.error || weekQuery.error || monthQuery.error,
  };
}

// WEEK VIEW - hook para cargar ocurrencias de una semana específica
export function useWeekOccurrences(refDate: DateTime) {
  const startWeek = startOfWeekISO(refDate);
  const endWeek = endOfWeekISO(refDate);

  return useQuery<Occ[]>({
    queryKey: ['appointments', 'week', startWeek, endWeek],
    queryFn: async () => {
      // 1) Ocurrencias de la semana (incluye recurrentes)
      const occs = await getOccurrences(startWeek, endWeek);

      // 2) Mapeo baseId -> assignedTo (leyendo turno base)
      const baseIds = Array.from(new Set(occs.map(o => o.id.split('::')[0])));
      const baseApps = await Promise.all(baseIds.map(id => db.appointments.get(id)));
      const assignedByBase: Record<string, string | undefined> = {};
      baseApps.forEach((a, idx) => {
        assignedByBase[baseIds[idx]] = a?.assignedTo || undefined;
      });

      // 3) Perfiles para nombre/rol
      const profiles = await db.userProfiles.toArray();
      const profileById = Object.fromEntries(profiles.map(p => [p.id, p]));

      // 4) Enriquecer + normalizar status + ordenar
      return occs
        .map<Occ>((occ) => {
          const baseId = occ.id.split('::')[0];
          const assignedTo = assignedByBase[baseId];
          const prof = assignedTo ? profileById[assignedTo] : undefined;

          const status =
            occ.status === 'pending' || occ.status === 'done' || occ.status === 'cancelled'
              ? occ.status
              : undefined;

          return {
            ...occ,
            status,
            assignedTo,
            assignedToName: prof?.name,
            assignedToRole: prof?.role,
          };
        })
        .sort((a, b) => a.start.localeCompare(b.start));
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - optimizado
    gcTime: 10 * 60 * 1000, // 10 minutos - mantener en caché más tiempo
    refetchOnWindowFocus: false, // No refetch al enfocar la ventana
    refetchOnMount: false, // No refetch al montar si ya tenemos datos
  });
}

// Actualizar las mutaciones para invalidar week occurrences también
export function useCreateAppointmentWithWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointment: Omit<Appointment, 'id'>) => db.appointments.add(appointment),
    onSuccess: () => {
      // 🚀 OPTIMIZACIÓN: Solo invalidar las queries esenciales
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'range'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'today'] });
      
      // No invalidar todas las semanas - esto causa demasiadas llamadas
      // queryClient.invalidateQueries({ queryKey: ['appointments', 'week'] });
      // queryClient.invalidateQueries({ queryKey: ['appointments', 'month'] });
    },
  });
}

export function useUpdateAppointmentWithWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, appointment }: { id?: string; appointment: Appointment }) => {
      if (id || appointment.id) {
        return db.appointments.put(appointment);
      }
      throw new Error('No appointment ID provided');
    },
    onSuccess: (_, variables) => {
      // Only invalidate specific queries instead of all week queries
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'range'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'today'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientStats });
      
      // 🎯 Invalidar estadísticas si hay datos de la cita
      if (variables.appointment?.startDateTime) {
        invalidateStatsForDate(queryClient, variables.appointment.startDateTime);
      }
      
      // Don't invalidate all week queries - let the optimistic update handle it
      // This prevents the "snap back" behavior
    },
  });
}

export function useDeleteAppointmentWithWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.appointments.delete(id),
    onSuccess: () => {
      // 🚀 OPTIMIZACIÓN: Solo invalidar las queries esenciales
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'range'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'today'] });
      
      // No invalidar todas las semanas - esto causa demasiadas llamadas
      // queryClient.invalidateQueries({ queryKey: ['appointments', 'week'] });
      // queryClient.invalidateQueries({ queryKey: ['appointments', 'month'] });
    },
  });
}

// FOLLOW UP VIEW - hook para clientes en riesgo
export function useClientsAtRiskCached(daysSinceLastVisit: number = 30) {
  return useQuery({
    queryKey: queryKeys.clientsAtRisk(daysSinceLastVisit),
    queryFn: () => getClientsAtRisk(daysSinceLastVisit),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para marcar recordatorio enviado
export function useMarkReminderSent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, method }: { clientId: string; method: 'whatsapp' | 'instagram' | 'phone' }) => 
      markReminderSent(clientId, method),
    onSuccess: () => {
      // Invalidar todos los cachés de clientes en riesgo y estadísticas
      queryClient.invalidateQueries({ queryKey: ['clientsAtRisk'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientStats });
    },
  });
}






// 🆕 Hook personalizado para múltiples fechas
export function useTrafficForPeriod(dates: string[]) {
  return useQuery({
    queryKey: ['trafficPeriod', dates],
    queryFn: async () => {
      const promises = dates.map(date => getDailyTraffic(date));
      return await Promise.all(promises);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: dates.length > 0,
  });
}

// 🆕 DAILY TRAFFIC HOOKS
export function useDailyTraffic(date: string) {
  return useQuery({
    queryKey: queryKeys.dailyTraffic(date),
    queryFn: () => getDailyTraffic(date),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!date,
  });
}

// 🆕 DAILY REVENUE HOOKS
export function useDailyRevenue(date: string) {
  return useQuery({
    queryKey: queryKeys.dailyRevenue(date),
    queryFn: () => getDailyRevenue(date),
    staleTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!date,
  });
}

// 🆕 APPOINTMENT MUTATIONS CON INVALIDACIÓN DE REVENUE
export function useUpdateAppointmentWithPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, appointment }: { id?: string; appointment: Appointment }) => {
      if (id || appointment.id) {
        // 🎯 Obtener la cita original para comparar estados
        const originalAppointment = await db.appointments.get(appointment.id || id!);
        
        // 🎯 Si se está cancelando y hay un cliente, actualizar estadísticas
        // Solo contar si es la primera vez que se cancela este turno específico
        if (appointment.status === 'cancelled' && 
            originalAppointment?.status !== 'cancelled' && 
            appointment.clientId) {
          
          // 🎯 Verificar si ya se registró esta cancelación anteriormente
          const existingCancellation = await db.clientHistory
            .where('appointmentId')
            .equals(appointment.id || id!)
            .first();
          
          // Verificar si la cancelación encontrada es del tipo correcto
          const isAlreadyCancelled = existingCancellation && existingCancellation.eventType === 'appointment_cancelled';
          
          if (!isAlreadyCancelled) {
            // Solo registrar si es la primera vez que se cancela este turno
            await db.clientHistory.add({
              clientId: appointment.clientId,
              eventType: 'appointment_cancelled',
              appointmentId: appointment.id || id!,
              timestamp: new Date().toISOString(),
              notes: `Cita cancelada desde modal: ${appointment.title || 'Turno'}`
            });
            
            // Actualizar total_cancellations del cliente
            const client = await db.clients.get(appointment.clientId);
            if (client) {
              const newTotal = (client.totalCancellations || 0) + 1;
              await db.clients.update(appointment.clientId, {
                totalCancellations: newTotal
              });
              
              // Log removido para optimización
            }
          } else {
            // Log removido para optimización
          }
        }
        
        return db.appointments.put(appointment);
      }
      throw new Error('No appointment ID provided');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'range'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'week'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'month'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientStats });
      
      // 🎯 Invalidar datos del cliente si se canceló
      if (variables.appointment.status === 'cancelled') {
        queryClient.invalidateQueries({ queryKey: queryKeys.clients });
        queryClient.invalidateQueries({ queryKey: queryKeys.clientStats });
      }
      
      // Invalidar revenue del día afectado
      const appointmentDate = new Date(variables.appointment.startDateTime);
      const dateString = appointmentDate.toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyRevenue(dateString) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyTraffic(dateString) });
      
      // Invalidar estadísticas mensuales
      const year = appointmentDate.getFullYear();
      const month = appointmentDate.getMonth() + 1;
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyStats(year, month) });
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlyTopServices(year, month) });
    },
  });
}

// 🆕 SMART STATUS UPDATE WITH BUSINESS LOGIC
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      appointmentId, 
      newStatus, 
      occurrenceStartISO 
    }: { 
      appointmentId: string; 
      newStatus: 'pending' | 'done' | 'cancelled';
      occurrenceStartISO?: string;
    }) => {
      // Detectar si es una ocurrencia de cita recurrente
      const isRecurringOccurrence = appointmentId.includes('::');
      
      if (isRecurringOccurrence) {
        // Es una ocurrencia específica de una cita recurrente
        const [baseId, occurrenceTime] = appointmentId.split('::');
        
        // Obtener la cita base
        const baseAppointment = await db.appointments.get(baseId);
        if (!baseAppointment) {
          throw new Error('Cita base no encontrada');
        }

        // Determinar la fecha de la ocurrencia específica
        const appointmentDate = occurrenceStartISO 
          ? new Date(occurrenceStartISO)
          : new Date(occurrenceTime);
        
        const now = new Date();
        const hoursDiff = (now.getTime() - appointmentDate.getTime()) / (1000 * 60 * 60);

        // 🚫 REGLAS DE NEGOCIO PARA EVENTOS PASADOS
        if (hoursDiff > 24) {
          if (newStatus === 'cancelled') {
            throw new Error('No se pueden cancelar eventos de más de 24 horas. Solo se pueden marcar como completados.');
          }
        }

        // Para citas recurrentes, SIEMPRE crear una cita individual
        const individualAppointment: Appointment = {
          id: crypto.randomUUID(), // Generar un UUID válido
          title: baseAppointment.title,
          startDateTime: appointmentDate.toISOString(),
          durationMin: baseAppointment.durationMin,
          isRecurring: false, // Convertir a cita individual
          serviceId: baseAppointment.serviceId,
          clientId: baseAppointment.clientId,
          assignedTo: baseAppointment.assignedTo,
          status: newStatus,
          paymentMethod: baseAppointment.paymentMethod,
          finalPrice: baseAppointment.finalPrice,
          listPrice: baseAppointment.listPrice,
          discount: baseAppointment.discount,
          paymentStatus: baseAppointment.paymentStatus,
          paymentNotes: baseAppointment.paymentNotes,
          notes: baseAppointment.notes,
          timezone: baseAppointment.timezone,
        };

        // Aplicar lógica específica por status
        if (newStatus === 'done') {
          individualAppointment.completedAt = now.toISOString();
          individualAppointment.startedAt = appointmentDate.toISOString();
          individualAppointment.actualDurationMin = Math.round((now.getTime() - appointmentDate.getTime()) / (1000 * 60));
        } else if (newStatus === 'cancelled') {
          individualAppointment.completedAt = undefined;
          individualAppointment.actualDurationMin = undefined;
          individualAppointment.startedAt = undefined;
          individualAppointment.paymentStatus = 'cancelled'; // 🎯 Actualizar estado de pago
        } else if (newStatus === 'pending') {
          individualAppointment.completedAt = undefined;
          individualAppointment.actualDurationMin = undefined;
          individualAppointment.startedAt = undefined;
        }

        // Crear la cita individual
        await db.appointments.put(individualAppointment);
        
        // 🎯 Si se está cancelando, registrar en historial del cliente
        if (newStatus === 'cancelled' && baseAppointment.clientId) {
          // Verificar si ya se registró esta cancelación anteriormente
          const existingCancellation = await db.clientHistory
            .where('appointmentId')
            .equals(individualAppointment.id)
            .first();
          
          // Verificar si la cancelación encontrada es del tipo correcto
          const isAlreadyCancelled = existingCancellation && existingCancellation.eventType === 'appointment_cancelled';
          
          if (!isAlreadyCancelled) {
            // Solo registrar si es la primera vez que se cancela este turno
            await db.clientHistory.add({
              clientId: baseAppointment.clientId,
              eventType: 'appointment_cancelled',
              appointmentId: individualAppointment.id,
              timestamp: new Date().toISOString(),
              notes: `Cita recurrente cancelada: ${baseAppointment.title || 'Turno'}`
            });
            
            // Actualizar total_cancellations del cliente
            const client = await db.clients.get(baseAppointment.clientId);
            if (client) {
              const newTotal = (client.totalCancellations || 0) + 1;
              await db.clients.update(baseAppointment.clientId, {
                totalCancellations: newTotal
              });
              
              // Log removido para optimización
            }
          } else {
            // Log removido para optimización
          }
        }
        
        // Crear excepción para evitar duplicación con la regla recurrente
        await db.exceptions.add({
          appointmentId: baseId,
          originalDateTime: appointmentDate.toISOString(),
          type: 'skip',
        });

        return { success: true, type: 'individual' };
      } else {
        // Es una cita única - usar lógica original
        const baseAppointment = await db.appointments.get(appointmentId);
        if (!baseAppointment) {
          throw new Error('Cita no encontrada');
        }

        // Determinar la fecha de la cita específica
        const appointmentDate = occurrenceStartISO 
          ? new Date(occurrenceStartISO)
          : new Date(baseAppointment.startDateTime);
        
        const now = new Date();
        const hoursDiff = (now.getTime() - appointmentDate.getTime()) / (1000 * 60 * 60);

        // 🚫 REGLAS DE NEGOCIO PARA EVENTOS PASADOS
        if (hoursDiff > 24) {
          if (newStatus === 'cancelled') {
            throw new Error('No se pueden cancelar eventos de más de 24 horas. Solo se pueden marcar como completados.');
          }
        }

        // 📊 LÓGICA ESPECÍFICA POR STATUS
        let updateData: Partial<Appointment> = { status: newStatus };

        if (newStatus === 'done') {
          updateData.completedAt = now.toISOString();
          if (!baseAppointment.actualDurationMin) {
            const actualDuration = Math.round((now.getTime() - appointmentDate.getTime()) / (1000 * 60));
            updateData.actualDurationMin = actualDuration;
          }
          if (!baseAppointment.startedAt) {
            updateData.startedAt = appointmentDate.toISOString();
          }
        } else if (newStatus === 'cancelled') {
          updateData.completedAt = undefined;
          updateData.actualDurationMin = undefined;
          updateData.startedAt = undefined;
          updateData.paymentStatus = 'cancelled'; // 🎯 Actualizar estado de pago
        } else if (newStatus === 'pending') {
          updateData.completedAt = undefined;
          updateData.actualDurationMin = undefined;
          updateData.startedAt = undefined;
        }

        const updatedAppointment = { ...baseAppointment, ...updateData };
        
        // 🎯 Si se está cancelando, registrar en historial del cliente
        if (newStatus === 'cancelled' && baseAppointment.clientId) {
          // Verificar si ya se registró esta cancelación anteriormente
          const existingCancellation = await db.clientHistory
            .where('appointmentId')
            .equals(appointmentId)
            .first();
          
          // Verificar si la cancelación encontrada es del tipo correcto
          const isAlreadyCancelled = existingCancellation && existingCancellation.eventType === 'appointment_cancelled';
          
          if (!isAlreadyCancelled) {
            // Solo registrar si es la primera vez que se cancela este turno
            await db.clientHistory.add({
              clientId: baseAppointment.clientId,
              eventType: 'appointment_cancelled',
              appointmentId: appointmentId,
              timestamp: new Date().toISOString(),
              notes: `Cita cancelada: ${baseAppointment.title || 'Turno'}`
            });
            
            // Actualizar total_cancellations del cliente
            const client = await db.clients.get(baseAppointment.clientId);
            if (client) {
              const newTotal = (client.totalCancellations || 0) + 1;
              await db.clients.update(baseAppointment.clientId, {
                totalCancellations: newTotal
              });
              
              // Log removido para optimización
            }
          } else {
            // Log removido para optimización
          }
        }
        
        return db.appointments.put(updatedAppointment);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'range'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'week'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'month'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientStats });
      
      // 🎯 Invalidar historial del cliente si se canceló
      if (variables.newStatus === 'cancelled') {
        queryClient.invalidateQueries({ queryKey: queryKeys.clients });
        queryClient.invalidateQueries({ queryKey: queryKeys.clientStats });
      }
      
      // 🎯 Invalidar todas las estadísticas relacionadas
      invalidateStatsForDate(queryClient, variables.occurrenceStartISO || '');
    },
  });
}

export function useCreateAppointmentWithPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointment: Omit<Appointment, 'id'>) => db.appointments.add(appointment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'range'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'week'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'month'] });
      
      // 🎯 Invalidar todas las estadísticas relacionadas
      invalidateStatsForDate(queryClient, variables.startDateTime);
    },
  });
}

// 🆕 Hook combinado para estadísticas de revenue con tráfico
export function useDailyStats(date: string) {
  const revenueQuery = useDailyRevenue(date);
  const trafficQuery = useDailyTraffic(date);

  return {
    revenue: revenueQuery.data,
    traffic: trafficQuery.data,
    isLoading: revenueQuery.isLoading || trafficQuery.isLoading,
    error: revenueQuery.error || trafficQuery.error,
  };
}

// EMPLEADOS (USER PROFILES) HOOKS
export function useUserProfiles() {
  return useQuery({
    queryKey: queryKeys.userProfiles,
    queryFn: () => db.userProfiles.toArray(),
    staleTime: 10 * 60 * 1000, // 10 minutos - empleados no cambian frecuentemente
  });
}

export function useUserProfile(id: string) {
  return useQuery({
    queryKey: [...queryKeys.userProfiles, id],
    queryFn: () => db.userProfiles.get(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// HORARIOS DE EMPLEADOS HOOKS
export function useStaffSchedules() {
  return useQuery({
    queryKey: queryKeys.staffSchedules,
    queryFn: () => db.staffSchedules.toArray(),
    staleTime: 30 * 60 * 1000, // 30 minutos - horarios no cambian frecuentemente
  });
}

export function useStaffSchedulesByUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.staffSchedulesByUser(userId),
    queryFn: () => db.staffSchedules.getByUser(userId),
    enabled: !!userId,
    staleTime: 30 * 60 * 1000,
  });
}

export function useAvailableStaff(dayOfWeek: number, time: string) {
  return useQuery({
    queryKey: queryKeys.availableStaff(dayOfWeek, time),
    queryFn: () => getAvailableStaff(dayOfWeek, time),
    enabled: dayOfWeek >= 0 && dayOfWeek <= 6 && !!time,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCreateStaffSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (schedule: Omit<StaffSchedule, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>) => 
      db.staffSchedules.add(schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staffSchedules });
      queryClient.invalidateQueries({ queryKey: ['staffSchedulesByUser'] });
      queryClient.invalidateQueries({ queryKey: ['availableStaff'] });
    },
  });
}

export function useUpdateStaffSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<StaffSchedule> }) => 
      db.staffSchedules.update(id, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staffSchedules });
      queryClient.invalidateQueries({ queryKey: ['staffSchedulesByUser'] });
      queryClient.invalidateQueries({ queryKey: ['availableStaff'] });
    },
  });
}

export function useDeleteStaffSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.staffSchedules.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staffSchedules });
      queryClient.invalidateQueries({ queryKey: ['staffSchedulesByUser'] });
      queryClient.invalidateQueries({ queryKey: ['availableStaff'] });
    },
  });
}

// MÉTRICAS DE TIEMPO HOOKS
export function useTimeMetrics(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.timeMetrics(`${startDate}-${endDate}`),
    queryFn: async () => {
      // Obtener todas las citas completadas en el período
      const appointments = await db.appointments.where('startDateTime').between(startDate, endDate).toArray();
      const completedAppointments = appointments.filter(apt => 
        apt.status === 'done' && apt.actualDurationMin !== undefined && apt.durationMin > 0
      );

      const uniqueServiceIds = Array.from(
        new Set(
          completedAppointments
            .map(a => a.serviceId)
            .filter((x): x is string => !!x)
        )
      );


      // 2) Pedimos esos servicios y armamos un mapa id -> nombre
      const servicesRows = await Promise.all(uniqueServiceIds.map(id => db.services.get(id)));
      const serviceNameById: Record<string, string> = {};
      servicesRows.forEach(s => { if (s) serviceNameById[s.id] = s.name; });

      // Calcular métricas
      const totalServices = completedAppointments.length;
      
      // Métricas de tiempo para appointments
      let totalEstimated = 0;
      let totalActual = 0;
      let accurateEstimates = 0; // dentro del 10% de precisión

      completedAppointments.forEach(apt => {
        if (apt.durationMin > 0 && apt.actualDurationMin) {
          totalEstimated += apt.durationMin;
          totalActual += apt.actualDurationMin;
          
          const variance = Math.abs(apt.actualDurationMin - apt.durationMin) / apt.durationMin;
          if (variance <= 0.1) accurateEstimates++;
        }
      });

      const allEstimated = totalEstimated;
      const allActual = totalActual;

      // Log removido para optimización

      return {
        totalServices,
        appointments: completedAppointments.length,
        
        // Métricas de tiempo
        totalEstimatedMinutes: allEstimated,
        totalActualMinutes: allActual,
        avgEstimatedMinutes: totalServices > 0 ? Math.round(allEstimated / totalServices) : 0,
        avgActualMinutes: totalServices > 0 ? Math.round(allActual / totalServices) : 0,
        
        // Precisión de estimaciones
        accuracyRate: completedAppointments.length > 0 ? 
          Math.round((accurateEstimates / completedAppointments.length) * 100) : 0,
        
        // Variación promedio
        avgVariancePercent: completedAppointments.length > 0 ? 
          Math.round((Math.abs(allActual - allEstimated) / allEstimated) * 100) : 0,
          
        // Servicios más rápidos/lentos de lo esperado
        fasterThanExpected: completedAppointments.filter(apt => 
          apt.durationMin > 0 && apt.actualDurationMin && apt.actualDurationMin < apt.durationMin * 0.9
        ).length,
        slowerThanExpected: completedAppointments.filter(apt => 
          apt.durationMin > 0 && apt.actualDurationMin && apt.actualDurationMin > apt.durationMin * 1.1
        ).length,
        
        // Datos para gráficos
        appointmentDetails: completedAppointments
          .filter(apt => apt.durationMin > 0 && (apt.actualDurationMin || 0) > 0) // 🎯 Filtrar datos válidos
          .map(apt => ({
            id: apt.id,
            serviceId: apt.serviceId,
            serviceName: apt.serviceId ? (serviceNameById[apt.serviceId] ?? 'Servicio') : 'Servicio',
            title: apt.title, // lo mantenemos por compatibilidad, pero usaremos serviceName
            estimated: apt.durationMin,
            actual: apt.actualDurationMin || 0,
            variance: apt.actualDurationMin && apt.durationMin > 0
              ? Math.round(((apt.actualDurationMin - apt.durationMin) / apt.durationMin) * 100)
              : 0,
            date: apt.startDateTime,
            assignedTo: apt.assignedTo
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), // 🎯 Ordenar por fecha
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos - optimizado
    gcTime: 5 * 60 * 1000, // 5 minutos en caché
    enabled: !!startDate && !!endDate,
  });
}

// HOOK PARA PRODUCTIVITY POR EMPLEADO
export function useEmployeeProductivity(userId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['employeeProductivity', userId, startDate, endDate],
    queryFn: async () => {
      const appointments = await db.appointments.where('startDateTime').between(startDate, endDate).toArray();
      const userAppointments = appointments.filter(apt => 
        apt.assignedTo === userId && apt.status === 'done'
      );


      const totalServices = userAppointments.length;
      const totalRevenue = userAppointments.reduce((sum, apt) => sum + (apt.finalPrice || 0), 0);

      const totalMinutes = userAppointments.reduce((sum, apt) => sum + (apt.actualDurationMin || apt.durationMin), 0);

      return {
        userId,
        totalServices,
        totalRevenue,
        totalMinutes,
        avgRevenuePerService: totalServices > 0 ? Math.round(totalRevenue / totalServices) : 0,
        avgMinutesPerService: totalServices > 0 ? Math.round(totalMinutes / totalServices) : 0,
        revenuePerMinute: totalMinutes > 0 ? Math.round(totalRevenue / totalMinutes) : 0,
        appointments: userAppointments.length,
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    enabled: !!userId && !!startDate && !!endDate,
  });
}

// ACTUALIZAR MUTATION DE APPOINTMENTS PARA INCLUIR TIMING
export function useUpdateAppointmentWithTiming() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, appointment }: { id?: string; appointment: Appointment }) => {
      if (id || appointment.id) {
        return db.appointments.put(appointment);
      }
      throw new Error('No appointment ID provided');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'range'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'week'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'month'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientStats });
      
      // Invalidar métricas de tiempo
      queryClient.invalidateQueries({ queryKey: ['timeMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['employeeProductivity'] });
      
      // 🎯 Invalidar todas las estadísticas relacionadas
      invalidateStatsForDate(queryClient, variables.appointment.startDateTime);
    },
  });
}

// 🎯 Función helper para invalidar estadísticas automáticamente
function invalidateStatsForDate(queryClient: any, date: string) {
  const appointmentDate = new Date(date);
  const year = appointmentDate.getFullYear();
  const month = appointmentDate.getMonth() + 1;
  const dateString = appointmentDate.toISOString().split('T')[0];
  
  // Invalidar estadísticas mensuales
  queryClient.invalidateQueries({ queryKey: ['monthlyStats', year, month] });
  queryClient.invalidateQueries({ queryKey: ['monthlyTopServices', year, month] });
  
  // Invalidar estadísticas diarias
  queryClient.invalidateQueries({ queryKey: ['dailyRevenue', dateString] });
  queryClient.invalidateQueries({ queryKey: ['dailyTraffic', dateString] });
}

// 🆕 Client Notes Hooks
export function useClientNotes(clientId: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ['clientNotes', clientId, page, limit],
    queryFn: () => db.clientNotes.getByClientId(clientId, page, limit),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useLatestClientNote(clientId: string) {
  return useQuery({
    queryKey: ['latestClientNote', clientId],
    queryFn: () => db.clientNotes.getLatestByClientId(clientId),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useClientNotesCount(clientId: string) {
  return useQuery({
    queryKey: ['clientNotesCount', clientId],
    queryFn: () => db.clientNotes.countByClientId(clientId),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useCreateClientNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (note: { clientId: string; noteText: string; createdBy: string }) => 
      db.clientNotes.add(note),
    onSuccess: (_, variables) => {
      // Invalidar todas las queries relacionadas con este cliente
      queryClient.invalidateQueries({ queryKey: ['clientNotes', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['latestClientNote', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['clientNotesCount', variables.clientId] });
    },
  });
}

export function useUpdateClientNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { noteText: string } }) => 
      db.clientNotes.update(id, updates),
    onSuccess: (_, variables) => {
      // Invalidar todas las queries de notas (no sabemos el clientId aquí)
      queryClient.invalidateQueries({ queryKey: ['clientNotes'] });
      queryClient.invalidateQueries({ queryKey: ['latestClientNote'] });
    },
  });
}

export function useDeleteClientNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => db.clientNotes.delete(id),
    onSuccess: () => {
      // Invalidar todas las queries de notas
      queryClient.invalidateQueries({ queryKey: ['clientNotes'] });
      queryClient.invalidateQueries({ queryKey: ['latestClientNote'] });
      queryClient.invalidateQueries({ queryKey: ['clientNotesCount'] });
    },
  });
}