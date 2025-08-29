import { QueryClient } from '@tanstack/react-query';

// Configuración de cache optimizada
export const cacheConfig = {
  // Tiempos de stale (cuándo considerar datos obsoletos)
  staleTime: {
    appointments: 2 * 60 * 1000, // 2 minutos
    clients: 5 * 60 * 1000, // 5 minutos
    services: 15 * 60 * 1000, // 15 minutos
    userProfiles: 10 * 60 * 1000, // 10 minutos
    staffSchedules: 5 * 60 * 1000, // 5 minutos
    walkIns: 1 * 60 * 1000, // 1 minuto
    occurrences: 1 * 60 * 1000, // 1 minuto
    stats: 5 * 60 * 1000, // 5 minutos
  },

  // Tiempos de garbage collection (cuándo eliminar del cache)
  gcTime: {
    appointments: 10 * 60 * 1000, // 10 minutos
    clients: 30 * 60 * 1000, // 30 minutos
    services: 60 * 60 * 1000, // 1 hora
    userProfiles: 30 * 60 * 1000, // 30 minutos
    staffSchedules: 15 * 60 * 1000, // 15 minutos
    walkIns: 5 * 60 * 1000, // 5 minutos
    occurrences: 5 * 60 * 1000, // 5 minutos
    stats: 15 * 60 * 1000, // 15 minutos
  },

  // Configuración de reintentos
  retry: {
    attempts: 3,
    delay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  }
};

// Función para invalidar cache de manera inteligente
export function invalidateCacheIntelligently(
  queryClient: QueryClient,
  type: 'appointment' | 'client' | 'service' | 'user' | 'stats' | 'all',
  options?: {
    appointmentId?: string;
    date?: string;
    userId?: string;
  }
) {
  const baseKeys = {
    appointments: ['appointments'],
    clients: ['clients'],
    services: ['services'],
    userProfiles: ['userProfiles'],
    staffSchedules: ['staffSchedules'],
    walkIns: ['walkIns'],
    occurrences: ['occurrences'],
    stats: ['monthlyStats', 'dailyRevenue', 'dailyTraffic', 'timeMetrics'],
  };

  switch (type) {
    case 'appointment':
      // Invalidar citas y estadísticas relacionadas
      queryClient.invalidateQueries({ queryKey: baseKeys.appointments });
      queryClient.invalidateQueries({ queryKey: baseKeys.occurrences });
      
      if (options?.date) {
        queryClient.invalidateQueries({ 
          queryKey: ['dailyRevenue', options.date] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['dailyTraffic', options.date] 
        });
      }
      break;

    case 'client':
      // Invalidar clientes y estadísticas relacionadas
      queryClient.invalidateQueries({ queryKey: baseKeys.clients });
      queryClient.invalidateQueries({ queryKey: ['clientStats'] });
      break;

    case 'service':
      // Invalidar servicios y estadísticas relacionadas
      queryClient.invalidateQueries({ queryKey: baseKeys.services });
      queryClient.invalidateQueries({ queryKey: baseKeys.stats });
      break;

    case 'user':
      // Invalidar perfiles de usuario y horarios
      queryClient.invalidateQueries({ queryKey: baseKeys.userProfiles });
      queryClient.invalidateQueries({ queryKey: baseKeys.staffSchedules });
      break;

    case 'stats':
      // Invalidar solo estadísticas
      queryClient.invalidateQueries({ queryKey: baseKeys.stats });
      break;

    case 'all':
      // Invalidar todo el cache
      Object.values(baseKeys).forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      break;
  }
}

// Función para optimizar queries con prefetch
export function prefetchCriticalData(queryClient: QueryClient) {
  // Prefetch datos críticos que se usan en múltiples vistas
  const prefetchPromises = [
    // Datos básicos
    queryClient.prefetchQuery({
      queryKey: ['services', 'all'],
      queryFn: () => Promise.resolve([]), // Placeholder
      staleTime: cacheConfig.staleTime.services,
    }),
    
    queryClient.prefetchQuery({
      queryKey: ['userProfiles', 'all'],
      queryFn: () => Promise.resolve([]), // Placeholder
      staleTime: cacheConfig.staleTime.userProfiles,
    }),
  ];

  return Promise.allSettled(prefetchPromises);
}

// Hook para gestión de cache optimizada
export function useCacheManager() {
  const queryClient = new QueryClient();

  const invalidateAppointments = (date?: string) => {
    invalidateCacheIntelligently(queryClient, 'appointment', { date });
  };

  const invalidateClients = () => {
    invalidateCacheIntelligently(queryClient, 'client');
  };

  const invalidateServices = () => {
    invalidateCacheIntelligently(queryClient, 'service');
  };

  const invalidateStats = () => {
    invalidateCacheIntelligently(queryClient, 'stats');
  };

  const invalidateAll = () => {
    invalidateCacheIntelligently(queryClient, 'all');
  };

  return {
    invalidateAppointments,
    invalidateClients,
    invalidateServices,
    invalidateStats,
    invalidateAll,
    prefetchCriticalData: () => prefetchCriticalData(queryClient),
  };
}
