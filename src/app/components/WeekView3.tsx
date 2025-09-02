'use client';

import { useState, useMemo, useCallback } from 'react';
import { DateTime } from 'luxon';
import { ChevronLeft, ChevronRight, Plus, Search, Menu, User } from 'lucide-react';
import { useData, useDataInvalidation } from '@/app/context/DataProvider';
import AppointmentForm from './AppointmentForm';

export type Occ = {
  id: string;
  start: string;
  end: string;
  title?: string;
  clientId?: string;
  status?: 'pending' | 'done' | 'cancelled';
  price?: number;
  startedAt?: string;
  completedAt?: string;
  actualDurationMin?: number;
  serviceId: string;
  assignedTo?: string | null;
  [key: string]: any;
};

type Props = { 
  onChanged?: () => void;
};

export default function WeekView3({ onChanged }: Props) {
  const [refDate, setRefDate] = useState(DateTime.now());
  const [selectedDate, setSelectedDate] = useState(DateTime.now()); // Nueva variable para el día seleccionado
  const [view, setView] = useState<'month' | 'week'>('month');
  const [creating, setCreating] = useState<string | undefined>();
  const [editing, setEditing] = useState<{ id: string; start: string; end: string } | undefined>();
  const [expandedDay, setExpandedDay] = useState<DateTime | null>(null);
  
  // 🎯 DataProvider para obtener todos los datos
  const { 
    appointments, 
    userProfiles, 
    loading,
    errors,
    hasErrors
  } = useData();
  const { invalidateAppointments } = useDataInvalidation();

  // Navegación de meses
  const goToPreviousMonth = () => {
    setRefDate(prev => prev.minus({ months: 1 }));
  };

  const goToNextMonth = () => {
    setRefDate(prev => prev.plus({ months: 1 }));
  };

  const goToToday = () => {
    setRefDate(DateTime.now());
  };

  // Generar días del mes
  const monthDays = useMemo(() => {
    const startOfMonth = refDate.startOf('month');
    const endOfMonth = refDate.endOf('month');
    const startOfWeek = startOfMonth.startOf('week');
    const endOfWeek = endOfMonth.endOf('week');
    
    const days = [];
    let current = startOfWeek;
    
    while (current <= endOfWeek) {
      days.push({
        date: current,
        isCurrentMonth: current.month === refDate.month,
        isToday: current.hasSame(DateTime.now(), 'day'),
        isSelected: false
      });
      current = current.plus({ days: 1 });
    }
    
    return days;
  }, [refDate]);

  // Obtener eventos del mes
  const monthEvents = useMemo(() => {
    if (!appointments.data.length) return [];
    
    const startOfMonth = refDate.startOf('month');
    const endOfMonth = refDate.endOf('month');
    
    return appointments.data.filter((appointment: any) => {
      const appointmentDate = DateTime.fromISO(appointment.startDateTime);
      return appointmentDate >= startOfMonth && appointmentDate <= endOfMonth;
    });
  }, [appointments.data, refDate]);

  // Obtener eventos para un día específico
  const getEventsForDay = (date: DateTime) => {
    return monthEvents.filter((event: any) => {
      const eventDate = DateTime.fromISO(event.startDateTime);
      return eventDate.hasSame(date, 'day');
    });
  };

  // Obtener color del estado del evento
  const getEventColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-emerald-500';
      case 'cancelled': return 'bg-rose-500';
      case 'pending': return 'bg-sky-500';
      default: return 'bg-slate-500';
    }
  };

  // Obtener texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'done': return 'Completada';
      case 'cancelled': return 'Cancelada';
      case 'pending': return 'Pendiente';
      default: return 'Sin asignar';
    }
  };

  // Nombres de meses en español
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Nombres de días en español
  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const handleFormSaved = () => {
    invalidateAppointments();
    onChanged?.();
  };

  // Manejar click para expandir/contraer día
  const handleDayClick = (date: DateTime) => {
    if (expandedDay?.hasSame(date, 'day')) {
      setExpandedDay(null); // Cerrar si ya está expandido
    } else {
      setExpandedDay(date); // Expandir el día seleccionado
    }
  };

  // Obtener fecha para crear evento (día expandido o día actual)
  const getDateForCreating = () => {
    return expandedDay ? expandedDay.startOf('day').plus({ hours: 9 }) : DateTime.now();
  };

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      {/* Header móvil estilo Google Calendar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Menú hamburguesa */}
          <button className="p-2 rounded-lg hover:bg-gray-100">
            <Menu size={20} className="text-gray-600" />
          </button>

          {/* Mes y año con navegación */}
          <div className="flex items-center gap-2">
            <button 
              onClick={goToPreviousMonth}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {monthNames[refDate.month - 1]}
              </div>
              <div className="text-sm text-gray-500">
                {refDate.year}
              </div>
            </div>
            
            <button 
              onClick={goToNextMonth}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <Search size={20} className="text-gray-600" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <User size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navegación rápida */}
        <div className="mt-3 flex items-center justify-center">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Navegación horizontal de meses */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {Array.from({ length: 12 }, (_, i) => {
            const monthDate = DateTime.now().plus({ months: i - 6 });
            const isCurrent = monthDate.month === refDate.month && monthDate.year === refDate.year;
            
            return (
              <button
                key={i}
                onClick={() => setRefDate(monthDate)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                  isCurrent 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {monthDate.toFormat('MMM').toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid del calendario */}
      <div className="bg-white">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {dayNames.map((day, index) => (
            <div 
              key={index}
              className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7">
          {monthDays.map((day, index) => {
            const dayEvents = getEventsForDay(day.date);
            const isToday = day.isToday;
            const isExpanded = expandedDay?.hasSame(day.date, 'day');
            
            return (
              <div
                key={index}
                className={`min-h-[80px] p-2 border-r border-b border-gray-200 ${
                  day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isToday ? 'bg-blue-50' : ''} ${isExpanded ? 'bg-blue-100' : ''}`}
                onClick={() => handleDayClick(day.date)}
              >
                {/* Número del día */}
                <div className={`text-sm font-medium mb-1 ${
                  day.isCurrentMonth 
                    ? isToday 
                      ? 'text-blue-600' 
                      : 'text-gray-900'
                    : 'text-gray-400'
                }`}>
                  {day.date.day}
                </div>

                {/* Eventos del día */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event: any) => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded truncate ${getEventColor(event.status)} text-white cursor-pointer hover:opacity-80 transition-opacity`}
                      title={`Clic para editar: ${event.title} - ${getStatusText(event.status)}`}
                      onClick={(e) => {
                        e.stopPropagation(); // Evitar que se active el tap del día
                        setEditing({
                          id: event.id,
                          start: event.startDateTime,
                          end: event.endDateTime || event.startDateTime
                        });
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayEvents.length - 2} más
                    </div>
                  )}
                </div>

                {/* Indicador de vista expandida */}
                {isExpanded && (
                  <div className="mt-2 text-xs text-blue-600 font-medium">
                    Click para cerrar
                  </div>
                )}
                
                {/* Indicador de click disponible */}
                {!isExpanded && dayEvents.length > 0 && (
                  <div className="mt-1 text-xs text-gray-400 text-center">
                    Click para ver detalles
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vista expandida del día - Nueva vista prominente */}
      {expandedDay && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          {/* Header de la vista del día */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 shadow-sm z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExpandedDay(null)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {expandedDay.toFormat('EEEE, d \'de\' MMMM', { locale: 'es' })}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Vista detallada del día
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCreating(getDateForCreating().toISO())}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={16} />
                  Crear
                </button>
                <button
                  onClick={() => setExpandedDay(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
          
          {/* Contenido principal - Cuadrícula horaria */}
          <div className="p-4">
            <div className="max-w-4xl mx-auto">
              {/* Cuadrícula horaria del día - Intervalos de 30 minutos */}
              <div className="space-y-0">
                {Array.from({ length: 26 }, (_, i) => {
                  const hour = Math.floor(i / 2) + 9; // Desde 9:00 AM hasta 9:00 PM
                  const minute = (i % 2) * 30; // 0 o 30 minutos
                  const timeSlot = DateTime.fromObject({ hour, minute });
                  
                  // Obtener eventos que empiezan en este slot de 30 minutos
                  const slotEvents = getEventsForDay(expandedDay).filter((event: any) => {
                    const eventTime = DateTime.fromISO(event.startDateTime);
                    // Convertir a zona horaria local para comparar con los slots
                    const eventTimeLocal = eventTime.toLocal();
                    const eventMinutes = eventTimeLocal.hour * 60 + eventTimeLocal.minute;
                    const slotStartMinutes = hour * 60 + minute;
                    const slotEndMinutes = slotStartMinutes + 30;
                    
                    // Evento empieza dentro de este slot de 30 minutos (en hora local)
                    return eventMinutes >= slotStartMinutes && eventMinutes < slotEndMinutes;
                  });
                  
                  // Debug: mostrar todos los eventos del día para verificar
                  if (hour === 9 && minute === 0) {
                            // console.log('🔍 Debug - Todos los eventos del día:', getEventsForDay(expandedDay));
        // console.log('🔍 Debug - Eventos filtrados por slot:', slotEvents);
        // console.log('🌍 Debug - Zona horaria del navegador:', Intl.DateTimeFormat().resolvedOptions().timeZone);
                    console.log('🌍 Debug - Hora actual local:', DateTime.now().toLocal().toFormat('HH:mm'));
                    console.log('🌍 Debug - Hora actual UTC:', DateTime.now().toUTC().toFormat('HH:mm'));
                  }
                  
                  // Debug adicional: mostrar eventos de cada slot para verificar asignación
                  if (slotEvents.length > 0) {
                    console.log(`🔍 Slot ${hour}:${minute.toString().padStart(2, '0')} - Eventos:`, slotEvents.map(e => ({
                      title: e.title,
                      start: e.startDateTime,
                      startLocal: DateTime.fromISO(e.startDateTime).toLocal().toFormat('HH:mm'),
                      startUTC: DateTime.fromISO(e.startDateTime).toUTC().toFormat('HH:mm'),
                      duration: e.durationMin,
                      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    })));
                  }
                  
                  return (
                    <div key={i} className="flex min-h-[30px] border-b border-gray-100">
                      {/* Hora */}
                      <div className="w-20 text-sm text-gray-500 font-medium pt-1">
                        {timeSlot.toFormat('HH:mm')}
                      </div>
                      
                      {/* Línea de tiempo y eventos */}
                      <div className="flex-1 relative">
                        {/* Línea de tiempo */}
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200"></div>
                        
                        {/* Eventos de este slot */}
                        <div className="pl-4 pt-1">
                          {slotEvents.map((event: any, eventIndex: number) => (
                            <div
                              key={event.id}
                              className={`mb-1 p-2 rounded-lg ${getEventColor(event.status)} text-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditing({
                                  id: event.id,
                                  start: event.startDateTime,
                                  end: event.endDateTime || event.startDateTime
                                });
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-sm">{event.title}</div>
                                <div className="text-xs opacity-90">
                                  {(() => {
                                    const start = DateTime.fromISO(event.startDateTime);
                                    // Calcular fin basado en durationMin, no en endDateTime
                                    const end = start.plus({ minutes: event.durationMin || 30 });
                                    return `${start.toFormat('HH:mm')} - ${end.toFormat('HH:mm')}`;
                                  })()}
                                </div>
                              </div>
                              <div className="text-xs opacity-90 mt-1">
                                {getStatusText(event.status)}
                              </div>
                            </div>
                          ))}
                          
                          {slotEvents.length === 0 && minute === 0 && (
                            <div className="text-xs text-gray-300 italic">
                              Sin eventos
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante de acción */}
      <button
        onClick={() => setCreating(DateTime.now().toISO())}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center"
      >
        <Plus size={24} />
      </button>

      {/* Modal de creación */}
      {creating && (
        <AppointmentForm
          defaultStart={creating}
          onClose={() => setCreating(undefined)}
          onSaved={() => {
            setCreating(undefined);
            handleFormSaved();
          }}
        />
      )}

      {/* Modal de edición */}
      {editing && (
        <AppointmentForm
          editingBaseId={editing.id}
          defaultStart={editing.start}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            handleFormSaved();
          }}
        />
      )}
    </div>
  );
}
