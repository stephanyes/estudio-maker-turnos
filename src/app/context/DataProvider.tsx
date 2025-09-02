'use client';

import React, { createContext, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { 
  db,
  Appointment,
  Client,
  Service,
  UserProfile,
  StaffSchedule,
  WalkIn
} from '@/lib/supabase-db';
import { getOccurrences } from '@/lib/schedule';
import { useAuth } from './AuthContext';

// Define occurrence types
interface AppointmentOccurrence {
  id: string;
  appointmentId: string;
  startTime: string;
  endTime: string;
  clientId: string;
  serviceId: string;
  staffId: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: 'appointment';
}

interface WalkInOccurrence {
  id: string;
  walkInId: string;
  startTime: string;
  clientId: string;
  serviceId: string;
  type: 'walk-in';
}

type Occurrence = AppointmentOccurrence | WalkInOccurrence;

// Tipos para el contexto
interface DataContextType {
  // Datos básicos
  appointments: {
    data: Appointment[];
    hasMore: boolean;
    loadMore: () => void;
    total: number;
  };
  clients: Client[];
  services: Service[];
  userProfiles: UserProfile[];
  staffSchedules: StaffSchedule[];
  walkIns: WalkIn[];
  
  // Datos procesados
  todayOccurrences: Occurrence[];
  weekOccurrences: Occurrence[];
  monthOccurrences: Occurrence[];
  
  // Estados de carga granulares
  loading: {
    core: boolean;        // appointments, clients, services
    staff: boolean;       // userProfiles, schedules
    realtime: boolean;    // walkIns, today's occurrences
    analytics: boolean;   // week/month occurrences
    any: boolean;         // any query loading
  };
  
  // Estados de disponibilidad
  isCoreDataReady: boolean;
  
  // Manejo de errores
  errors: {
    appointments?: Error;
    clients?: Error;
    services?: Error;
    userProfiles?: Error;
    staffSchedules?: Error;
    walkIns?: Error;
    occurrences?: Error;
  };
  hasErrors: boolean;
  canRetry: boolean;
  retry: () => void;
  
  // Funciones de utilidad
  getClientById: (id: string) => Client | undefined;
  getServiceById: (id: string) => Service | undefined;
  getUserProfileById: (id: string) => UserProfile | undefined;
  
  // Funciones de carga selectiva
  loadAppointmentsByDateRange: (start: string, end: string) => Promise<Appointment[]>;
  searchClients: (query: string, limit?: number) => Promise<Client[]>;
  
  // Estadísticas
  stats: {
    today: number;
    week: number;
    month: number;
  };
}

// Crear el contexto
const DataContext = createContext<DataContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

  // Hook para invalidar el cache del DataProvider
  export function useDataInvalidation() {
    const queryClient = useQueryClient();
    
    const invalidateAll = useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['clients', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['services', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['userProfiles', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['staffSchedules', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['walkIns', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['occurrences', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['occurrences', 'week'] });
      queryClient.invalidateQueries({ queryKey: ['occurrences', 'month'] });
    }, [queryClient]);
    
    const invalidateAppointments = useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['occurrences', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['occurrences', 'week'] });
      queryClient.invalidateQueries({ queryKey: ['occurrences', 'month'] });
    }, [queryClient]);
    
    const invalidateStats = useCallback((date?: string) => {
      // Invalidar estadísticas mensuales del mes actual
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      queryClient.invalidateQueries({ queryKey: ['monthlyStats', year, month] });
      queryClient.invalidateQueries({ queryKey: ['monthlyTopServices', year, month] });
      
      // Si se proporciona una fecha específica, invalidar también las estadísticas diarias
      if (date) {
        queryClient.invalidateQueries({ queryKey: ['dailyRevenue', date] });
        queryClient.invalidateQueries({ queryKey: ['dailyTraffic', date] });
      }
    }, [queryClient]);
    
    return {
      invalidateAll,
      invalidateAppointments,
      invalidateStats,
    };
  }

// Hook para generar rangos de fechas dinámicos
const useDateRanges = () => useMemo(() => {
  const now = DateTime.now();
  return {
    today: {
      key: now.toFormat('yyyy-MM-dd'),
      start: now.startOf('day').toISO()!,
      end: now.endOf('day').toISO()!
    },
    week: {
      key: `${now.year}-W${now.weekNumber}`,
      start: now.startOf('week').toISO()!,
      end: now.endOf('week').toISO()!
    },
    month: {
      key: now.toFormat('yyyy-MM'),
      start: now.startOf('month').toISO()!,
      end: now.endOf('month').toISO()!
    }
  };
}, []);

// Provider principal
export function DataProvider({ children }: { children: ReactNode }) {
  const dateRanges = useDateRanges();
  const { user, userProfile, loading: authLoading } = useAuth();
  
  // 🎯 CONDICIÓN CRÍTICA: Solo hacer queries si el usuario está autenticado y el perfil está cargado
  const isAuthenticated = !!user && !authLoading && !!userProfile;
  
  console.log('📊 DataProvider: Estado de autenticación:', {
    hasUser: !!user,
    authLoading,
    hasProfile: !!userProfile,
    isAuthenticated
  });
  
  // 🎯 QUERIES PRINCIPALES con paginación y mejores configuraciones
  
  // 1. Datos básicos de la base de datos - usar simple query por ahora
  const appointmentsQuery = useQuery({
    queryKey: ['appointments', 'all'],
    queryFn: async () => {
      console.log('📊 DataProvider: Cargando appointments...');
      try {
        const result = await db.appointments.toArray();
        console.log('📊 DataProvider: Appointments cargados:', result.length);
        return result;
      } catch (error) {
        console.error('❌ DataProvider: Error cargando appointments:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: isAuthenticated, // 🎯 Solo ejecutar si está autenticado
  });

  const clientsQuery = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: async () => {
      console.log('📊 DataProvider: Cargando clients...');
      try {
        const result = await db.clients.toArray();
        console.log('📊 DataProvider: Clients cargados:', result.length);
        return result;
      } catch (error) {
        console.error('❌ DataProvider: Error cargando clients:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: isAuthenticated, // 🎯 Solo ejecutar si está autenticado
  });

  const servicesQuery = useQuery({
    queryKey: ['services', 'all'],
    queryFn: async () => {
      console.log('📊 DataProvider: Cargando services...');
      try {
        const result = await db.services.toArray();
        console.log('📊 DataProvider: Services cargados:', result.length);
        return result;
      } catch (error) {
        console.error('❌ DataProvider: Error cargando services:', error);
        throw error;
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
    enabled: isAuthenticated, // 🎯 Solo ejecutar si está autenticado
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const userProfilesQuery = useQuery({
    queryKey: ['userProfiles', 'all'],
    queryFn: async () => {
      console.log('📊 DataProvider: Cargando userProfiles...');
      try {
        const result = await db.userProfiles.toArray();
        console.log('📊 DataProvider: UserProfiles cargados:', result.length);
        return result;
      } catch (error) {
        console.error('❌ DataProvider: Error cargando userProfiles:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: isAuthenticated, // 🎯 Solo ejecutar si está autenticado
  });

  const staffSchedulesQuery = useQuery({
    queryKey: ['staffSchedules', 'all'],
    queryFn: async () => {
      console.log('📊 DataProvider: Cargando staffSchedules...');
      try {
        const result = await db.staffSchedules.toArray();
        console.log('📊 DataProvider: StaffSchedules cargados:', result.length);
        return result;
      } catch (error) {
        console.error('❌ DataProvider: Error cargando staffSchedules:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: isAuthenticated, // 🎯 Solo ejecutar si está autenticado
  });

  const walkInsQuery = useQuery({
    queryKey: ['walkIns', 'all'],
    queryFn: async () => {
      console.log('📊 DataProvider: Cargando walkIns...');
      try {
        const result = await db.walkIns.toArray();
        console.log('📊 DataProvider: WalkIns cargados:', result.length);
        return result;
      } catch (error) {
        console.error('❌ DataProvider: Error cargando walkIns:', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: isAuthenticated, // 🎯 Solo ejecutar si está autenticado
  });

  // 2. Versionado de datos para dependencias
  const dataVersion = useMemo(() => ({
    appointments: appointmentsQuery.dataUpdatedAt,
    schedules: staffSchedulesQuery.dataUpdatedAt,
    walkIns: walkInsQuery.dataUpdatedAt,
  }), [appointmentsQuery.dataUpdatedAt, staffSchedulesQuery.dataUpdatedAt, walkInsQuery.dataUpdatedAt]);
  
  // 3. Ocurrencias procesadas con dependencias correctas y fechas dinámicas
  // Temporalmente deshabilitadas para debug
  const todayOccurrencesQuery = useQuery({
    queryKey: ['occurrences', 'today', dateRanges.today.key, dataVersion],
    queryFn: async () => {
      try {
        return await getOccurrences(
          dateRanges.today.start,
          dateRanges.today.end
        );
      } catch (error) {
        console.error('Error in todayOccurrencesQuery:', error);
        return []; // Return empty array on error
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: isAuthenticated && appointmentsQuery.isSuccess,
    retry: 1,
    retryDelay: 1000,
  });

  const weekOccurrencesQuery = useQuery({
    queryKey: ['occurrences', 'week', dateRanges.week.key, dataVersion],
    queryFn: async () => {
      try {
        return await getOccurrences(
          dateRanges.week.start,
          dateRanges.week.end
        );
      } catch (error) {
        console.error('Error in weekOccurrencesQuery:', error);
        return []; // Return empty array on error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: isAuthenticated && appointmentsQuery.isSuccess,
    retry: 1,
    retryDelay: 1000,
  });

  const monthOccurrencesQuery = useQuery({
    queryKey: ['occurrences', 'month', dateRanges.month.key, dataVersion],
    queryFn: async () => {
      try {
        return await getOccurrences(
          dateRanges.month.start,
          dateRanges.month.end
        );
      } catch (error) {
        console.error('Error in monthOccurrencesQuery:', error);
        return []; // Return empty array on error
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: isAuthenticated && appointmentsQuery.isSuccess,
    retry: 1,
    retryDelay: 1000,
  });

  // 🚀 ESTADOS DE CARGA GRANULARES
  const loading = useMemo(() => ({
    core: appointmentsQuery.isLoading || clientsQuery.isLoading || servicesQuery.isLoading,
    staff: userProfilesQuery.isLoading || staffSchedulesQuery.isLoading,
    realtime: walkInsQuery.isLoading || todayOccurrencesQuery.isLoading,
    analytics: weekOccurrencesQuery.isLoading || monthOccurrencesQuery.isLoading,
    any: appointmentsQuery.isLoading || clientsQuery.isLoading || servicesQuery.isLoading ||
         userProfilesQuery.isLoading || staffSchedulesQuery.isLoading || walkInsQuery.isLoading ||
         todayOccurrencesQuery.isLoading || weekOccurrencesQuery.isLoading || monthOccurrencesQuery.isLoading
  }), [
    appointmentsQuery.isLoading, clientsQuery.isLoading, servicesQuery.isLoading,
    userProfilesQuery.isLoading, staffSchedulesQuery.isLoading, walkInsQuery.isLoading,
    todayOccurrencesQuery.isLoading, weekOccurrencesQuery.isLoading, monthOccurrencesQuery.isLoading
  ]);

  // 🎯 Solo considerar datos listos si está autenticado Y los queries fueron exitosos
  const isCoreDataReady = isAuthenticated && appointmentsQuery.isSuccess && clientsQuery.isSuccess && servicesQuery.isSuccess;

  // 🚨 MANEJO DE ERRORES GRANULAR
  const errors = useMemo(() => ({
    appointments: appointmentsQuery.error || undefined,
    clients: clientsQuery.error || undefined,
    services: servicesQuery.error || undefined,
    userProfiles: userProfilesQuery.error || undefined,
    staffSchedules: staffSchedulesQuery.error || undefined,
    walkIns: walkInsQuery.error || undefined,
    occurrences: todayOccurrencesQuery.error || weekOccurrencesQuery.error || monthOccurrencesQuery.error || undefined,
  }), [
    appointmentsQuery.error, clientsQuery.error, servicesQuery.error,
    userProfilesQuery.error, staffSchedulesQuery.error, walkInsQuery.error,
    todayOccurrencesQuery.error, weekOccurrencesQuery.error, monthOccurrencesQuery.error
  ]);

  // 🎯 Solo considerar errores si está autenticado, sino no hay errores reales
  const hasErrors = isAuthenticated && Object.values(errors).some(error => error !== null && error !== undefined);
  const canRetry = hasErrors && !loading.any;

  // Debug: Verificar exactamente qué está pasando con hasErrors
  const actualErrorCount = Object.values(errors).filter(error => error !== null && error !== undefined).length;
  const actualErrorKeys = Object.entries(errors)
    .filter(([_, error]) => error !== null && error !== undefined)
    .map(([key, _]) => key);
  
  // console.log('🔍 DataProvider Error Logic Debug:', {
  //   errorsObject: errors,
  //   hasErrors,
  //   actualErrorCount,
  //   actualErrorKeys,
  //   someResult: Object.values(errors).some(error => error !== null && error !== undefined),
  //   filterResult: Object.values(errors).filter(error => error !== null && error !== undefined),
  //   allValues: Object.values(errors),
  //   nullCheck: Object.values(errors).map(error => error === null),
  //   undefinedCheck: Object.values(errors).map(error => error === undefined)
  // });

  // Función de retry
  const retry = useCallback(() => {
    if (errors.appointments) appointmentsQuery.refetch();
    if (errors.clients) clientsQuery.refetch();
    if (errors.services) servicesQuery.refetch();
    if (errors.userProfiles) userProfilesQuery.refetch();
    if (errors.staffSchedules) staffSchedulesQuery.refetch();
    if (errors.walkIns) walkInsQuery.refetch();
    if (errors.occurrences) {
      todayOccurrencesQuery.refetch();
      weekOccurrencesQuery.refetch();
      monthOccurrencesQuery.refetch();
    }
  }, [
    errors, appointmentsQuery, clientsQuery, servicesQuery,
    userProfilesQuery, staffSchedulesQuery, walkInsQuery,
    todayOccurrencesQuery, weekOccurrencesQuery, monthOccurrencesQuery
  ]);

  // 📊 ESTADÍSTICAS
  const stats = {
    today: todayOccurrencesQuery.data?.length ?? 0,
    week: weekOccurrencesQuery.data?.length ?? 0,
    month: monthOccurrencesQuery.data?.length ?? 0,
  };

  // 🔍 FUNCIONES DE UTILIDAD
  const getClientById = useCallback((id: string) => 
    clientsQuery.data?.find(client => client.id === id), [clientsQuery.data]);

  const getServiceById = useCallback((id: string) => 
    servicesQuery.data?.find(service => service.id === id), [servicesQuery.data]);

  const getUserProfileById = useCallback((id: string) => 
    userProfilesQuery.data?.find(profile => profile.id === id), [userProfilesQuery.data]);

  // 📥 FUNCIONES DE CARGA SELECTIVA
  const loadAppointmentsByDateRange = useCallback(
    async (start: string, end: string): Promise<Appointment[]> => {
      return db.appointments
        .where('startTime')
        .between(start, end)
        .toArray();
    }, []
  );

  const searchClients = useCallback(
    async (query: string, limit = 20): Promise<Client[]> => {
      const allClients = await db.clients.toArray();
      return allClients
        .filter((client: Client) => 
          client.name?.toLowerCase().includes(query.toLowerCase()) ||
          // client.email?.toLowerCase().includes(query.toLowerCase()) ||
          client.phone?.includes(query)
        )
        .slice(0, limit);
    }, []
  );

  // 📋 DATOS SIMPLES (futuro: implementar paginación real)
  const allAppointments = appointmentsQuery.data ?? [];
  const appointmentsData = {
    data: allAppointments,
    hasMore: false, // Por ahora no hay paginación
    loadMore: () => {}, // Placeholder
    total: allAppointments.length
  };

  // 📦 VALOR DEL CONTEXTO
  const value: DataContextType = {
    appointments: appointmentsData,
    clients: clientsQuery.data ?? [],
    services: servicesQuery.data ?? [],
    userProfiles: userProfilesQuery.data ?? [],
    staffSchedules: staffSchedulesQuery.data ?? [],
    walkIns: walkInsQuery.data ?? [],
    
    todayOccurrences: (todayOccurrencesQuery.data ?? []) as unknown as Occurrence[],
    weekOccurrences: (weekOccurrencesQuery.data ?? []) as unknown as Occurrence[],
    monthOccurrences: (monthOccurrencesQuery.data ?? []) as unknown as Occurrence[],
    
    loading,
    isCoreDataReady,
    
    errors,
    hasErrors,
    canRetry,
    retry,
    
    getClientById,
    getServiceById,
    getUserProfileById,
    
    loadAppointmentsByDateRange,
    searchClients,
    
    stats,
  };

  // Logging para debug del estado final
  // console.log('🔍 DataProvider Final State:', {
  //   isCoreDataReady,
  //   hasErrors,
  //   canRetry,
  //   loadingStates: {
  //     core: loading.core,
  //     staff: loading.staff,
  //     realtime: loading.realtime,
  //     analytics: loading.analytics,
  //     any: loading.any
  //   },
  //   dataCounts: {
  //     appointments: appointmentsQuery.data?.length ?? 0,
  //     clients: clientsQuery.data?.length ?? 0,
  //     services: servicesQuery.data?.length ?? 0,
  //     userProfiles: userProfilesQuery.data?.length ?? 0,
  //     staffSchedules: staffSchedulesQuery.data?.length ?? 0,
  //     walkIns: walkInsQuery.data?.length ?? 0,
  //   },
  //   queryStates: {
  //     appointments: {
  //       isLoading: appointmentsQuery.isLoading,
  //       isSuccess: appointmentsQuery.isSuccess,
  //       isError: appointmentsQuery.isError,
  //       error: appointmentsQuery.error?.message
  //     },
  //     clients: {
  //       isLoading: clientsQuery.isLoading,
  //       isSuccess: clientsQuery.isSuccess,
  //       isError: clientsQuery.isError,
  //       error: clientsQuery.error?.message
  //     },
  //     services: {
  //       isLoading: servicesQuery.isLoading,
  //       isSuccess: servicesQuery.isSuccess,
  //       isError: servicesQuery.isError,
  //       error: servicesQuery.error?.message
  //     }
  //   }
  // });

  // useEffect para monitorear cambios en errores
  useEffect(() => {
    const errorCount = Object.values(errors).filter(error => error !== null).length;
    const errorKeys = Object.entries(errors)
      .filter(([_, error]) => error)
      .map(([key, _]) => key);

    // console.log('🔍 DataProvider Error Monitor:', {
    //   hasErrors,
    //   canRetry,
    //   errorCount,
    //   errorKeys,
    //   errorDetails: Object.entries(errors)
    //     .filter(([_, error]) => error)
    //     .map(([key, error]) => ({ key, error: error?.message || 'Unknown error' })),
    //   rawErrors: {
    //     appointments: appointmentsQuery.error,
    //     clients: clientsQuery.error,
    //     services: servicesQuery.error,
    //     userProfiles: userProfilesQuery.error,
    //     staffSchedules: staffSchedulesQuery.error,
    //     walkIns: walkInsQuery.error,
    //     todayOccurrences: todayOccurrencesQuery.error,
    //     weekOccurrences: weekOccurrencesQuery.error,
    //     monthOccurrences: monthOccurrencesQuery.error,
    //   }
    // });
  }, [errors, hasErrors, canRetry, appointmentsQuery.error, clientsQuery.error, servicesQuery.error, userProfilesQuery.error, staffSchedulesQuery.error, walkInsQuery.error, todayOccurrencesQuery.error, weekOccurrencesQuery.error, monthOccurrencesQuery.error]);

  // useEffect para monitorear el estado general
  useEffect(() => {
    // console.log('🔍 DataProvider State Monitor:', {
    //   isCoreDataReady,
    //   loadingStates: {
    //     core: loading.core,
    //     staff: loading.staff,
    //     realtime: loading.realtime,
    //     analytics: loading.analytics,
    //     any: loading.any
    //   },
    //   queryStates: {
    //     appointments: {
    //       isLoading: appointmentsQuery.isLoading,
    //       isSuccess: appointmentsQuery.isSuccess,
    //       isError: appointmentsQuery.isError,
    //       dataLength: appointmentsQuery.data?.length ?? 0
    //     },
    //     clients: {
    //       isLoading: clientsQuery.isLoading,
    //       isSuccess: clientsQuery.isSuccess,
    //       isError: clientsQuery.isError,
    //       dataLength: clientsQuery.data?.length ?? 0
    //     },
    //     services: {
    //       isLoading: servicesQuery.isLoading,
    //       isSuccess: servicesQuery.isSuccess,
    //       isError: servicesQuery.isError,
    //       dataLength: servicesQuery.data?.length ?? 0
    //     }
    //   }
    // });
  }, [isCoreDataReady, loading, appointmentsQuery, clientsQuery, servicesQuery]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
