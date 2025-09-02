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

  return (
    <div className="min-h-screen bg-gray-50">
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
            
            return (
              <div
                key={index}
                className={`min-h-[80px] p-2 border-r border-b border-gray-200 ${
                  day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isToday ? 'bg-blue-50' : ''}`}
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
                      onClick={() => setEditing({
                        id: event.id,
                        start: event.startDateTime,
                        end: event.endDateTime || event.startDateTime
                      })}
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
              </div>
            );
          })}
        </div>
      </div>

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
