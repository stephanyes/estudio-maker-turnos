'use client';
import { useState } from 'react';
import { DateTime } from 'luxon';
import { useDailyRevenue, useUserProfiles } from '@/lib/queries';
import { Appointment, WalkIn } from '@/lib/supabase-db';
import ServiceTimerControl from './ServiceTimerControl';
import { Timer, Calendar, User, Clock, Play, DollarSign, CheckCircle } from 'lucide-react';

export default function ActiveServicesView() {
  const [selectedDate, setSelectedDate] = useState(DateTime.now().toFormat('yyyy-LL-dd'));
  
  const { data: dailyData, isLoading, error, refetch } = useDailyRevenue(selectedDate);
  const { data: userProfiles = [] } = useUserProfiles();

  // Filtrar servicios que necesitan control de tiempo
  const activeServices = [
    // Citas del día que están done pero no completadas
    ...(dailyData?.appointments || []).filter((apt: Appointment) => 
      apt.status === 'done' && !apt.completedAt
    ).map(apt => ({ ...apt, type: 'appointment' })),
    
    // Walk-ins del día que no están completados
    ...(dailyData?.walkIns || []).filter((wi: WalkIn) => 
      !wi.completedAt
    ).map(wi => ({ ...wi, type: 'walkIn' }))
  ].sort((a, b) => {
    // Ordenar por hora de inicio programada o timestamp
    const timeA = a.type === 'appointment' ? (a as Appointment).startDateTime : (a as WalkIn).timestamp;
    const timeB = b.type === 'appointment' ? (b as Appointment).startDateTime : (b as WalkIn).timestamp;
    return timeA.localeCompare(timeB);
  });

  const getEmployeeName = (employeeId?: string) => {
    if (!employeeId) return 'Sin asignar';
    const employee = userProfiles.find(u => u.id === employeeId);
    return employee?.name || 'Empleado desconocido';
  };

  const formatTime = (isoString: string) => {
    return DateTime.fromISO(isoString).toFormat('HH:mm');
  };

  const formatPrice = (centavos?: number) => {
    if (!centavos && centavos !== 0) return '-';
    return `$${(centavos / 100).toFixed(2)}`;
  };

  const getServiceStatus = (service: any) => {
    if (service.completedAt) return { text: 'Completado', color: 'text-green-600' };
    if (service.startedAt) return { text: 'En progreso', color: 'text-blue-600' };
    if (service.type === 'appointment' && service.status === 'done') {
      return { text: 'Listo para iniciar', color: 'text-amber-600' };
    }
    return { text: 'Pendiente', color: 'text-zinc-500' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="animate-spin w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full flex-shrink-0"></div>
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">Cargando servicios activos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p className="mb-4">Error al cargar los servicios</p>
        <button 
          onClick={() => refetch()} 
          className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Timer className="w-6 h-6 text-sky-600" />
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Control de Servicios Activos
          </h1>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={DateTime.now().toFormat('yyyy-LL-dd')}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-neutral-900 px-3 py-2"
        />
      </div>

      {/* Servicios activos */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Servicios en progreso o listos para iniciar ({activeServices.length})
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Controla el tiempo real de cada servicio
          </p>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {activeServices.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-zinc-500 dark:text-zinc-400">
                No hay servicios activos para {DateTime.fromISO(selectedDate).toFormat('dd/LL/yyyy')}
              </p>
            </div>
          ) : (
            activeServices.map((service) => {
              const isAppointment = service.type === 'appointment';
              const serviceData = service as (Appointment & { type: string }) | (WalkIn & { type: string });
              const status = getServiceStatus(service);
              
              return (
                <div key={`${service.type}-${service.id}`} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {isAppointment ? (
                            <Calendar className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Play className="w-4 h-4 text-green-500" />
                          )}
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {isAppointment ? 'Cita' : 'Walk-in'}
                          </span>
                          <span className={`text-sm font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-zinc-400" />
                            <span className="text-zinc-600 dark:text-zinc-300">
                              {isAppointment 
                                ? `${formatTime((serviceData as Appointment).startDateTime)} (${(serviceData as Appointment).durationMin}min)`
                                : formatTime((serviceData as WalkIn).timestamp)
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-zinc-400" />
                            <span className="text-zinc-600 dark:text-zinc-300">
                              {getEmployeeName(isAppointment ? (serviceData as Appointment).assignedTo : (serviceData as WalkIn).servedBy)}
                            </span>
                          </div>

                          {(serviceData.finalPrice !== undefined && serviceData.finalPrice !== null) && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-zinc-400" />
                              <span className="text-zinc-600 dark:text-zinc-300">
                                {formatPrice(serviceData.finalPrice)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-sm">
                          <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                            {isAppointment 
                              ? ((serviceData as Appointment).title || 'Cita sin título')
                              : ((serviceData as WalkIn).serviceName || 'Walk-in')
                            }
                          </p>
                          {serviceData.notes && (
                            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                              {serviceData.notes}
                            </p>
                          )}
                        </div>

                        {/* Métricas de tiempo */}
                        {(serviceData.startedAt || serviceData.completedAt || (isAppointment && (serviceData as Appointment).actualDurationMin)) && (
                          <div className="bg-zinc-50 dark:bg-neutral-900 rounded-lg p-3 space-y-2">
                            {serviceData.startedAt && (
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-500 dark:text-zinc-400">Iniciado:</span>
                                <span className="text-zinc-700 dark:text-zinc-300">
                                  {formatTime(serviceData.startedAt)}
                                </span>
                              </div>
                            )}
                            {serviceData.completedAt && (
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-500 dark:text-zinc-400">Completado:</span>
                                <span className="text-zinc-700 dark:text-zinc-300">
                                  {formatTime(serviceData.completedAt)}
                                </span>
                              </div>
                            )}
                            {isAppointment && (serviceData as Appointment).actualDurationMin && (
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-500 dark:text-zinc-400">Duración real:</span>
                                <span className="text-zinc-700 dark:text-zinc-300">
                                  {(serviceData as Appointment).actualDurationMin} min
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Control de timer */}
                    <div className="flex-shrink-0">
                      <ServiceTimerControl
                        service={serviceData}
                        type={isAppointment ? 'appointment' : 'walkIn'}
                        onUpdate={refetch}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Stats rápidas */}
      {activeServices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
            <div className="flex items-center gap-3">
              <Play className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">En progreso</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {activeServices.filter(s => s.startedAt && !s.completedAt).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Listos</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {activeServices.filter(s => !s.startedAt).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5 text-sky-500" />
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total activos</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {activeServices.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}