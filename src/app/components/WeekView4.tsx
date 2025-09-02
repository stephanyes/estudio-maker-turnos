'use client';

import { useState, useMemo, useCallback } from 'react';
import { DateTime } from 'luxon';
import { ChevronLeft, ChevronRight, Plus, Search, Menu, Settings, Calendar, Grid3X3, User, HelpCircle } from 'lucide-react';
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

export default function WeekView4({ onChanged }: Props) {
  const [refDate, setRefDate] = useState(DateTime.now());
  const [selectedDate, setSelectedDate] = useState(DateTime.now()); // Nueva variable para el día seleccionado
  const [view, setView] = useState<'week' | 'month'>('week');
  const [creating, setCreating] = useState<string | undefined>();
  const [editing, setEditing] = useState<{ id: string; start: string; end: string } | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  
  // 🎯 DataProvider para obtener todos los datos
  const { 
    appointments, 
    userProfiles, 
    loading,
    errors,
    hasErrors
  } = useData();
  const { invalidateAppointments } = useDataInvalidation();

  // Navegación
  const goToPrevious = () => {
    if (view === 'week') {
      setRefDate(prev => prev.minus({ weeks: 1 }));
    } else {
      setRefDate(prev => prev.minus({ months: 1 }));
    }
  };

  const goToNext = () => {
    if (view === 'week') {
      setRefDate(prev => prev.plus({ weeks: 1 }));
    } else {
      setRefDate(prev => prev.plus({ months: 1 }));
    }
  };

  const goToToday = () => {
    setRefDate(DateTime.now());
  };

  // Generar días de la semana
  const weekDays = useMemo(() => {
    const startOfWeek = refDate.startOf('week');
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = startOfWeek.plus({ days: i });
      days.push({
        date: day,
        isToday: day.hasSame(DateTime.now(), 'day'),
        isCurrentWeek: day.hasSame(refDate, 'week')
      });
    }
    
    return days;
  }, [refDate]);

  // Obtener eventos de la semana
  const weekEvents = useMemo(() => {
    if (!appointments.data.length) return [];
    
    const startOfWeek = refDate.startOf('week');
    const endOfWeek = refDate.endOf('week');
    
    return appointments.data.filter((appointment: any) => {
      const appointmentDate = DateTime.fromISO(appointment.startDateTime);
      return appointmentDate >= startOfWeek && appointmentDate <= endOfWeek;
    });
  }, [appointments.data, refDate]);

  // Obtener eventos para un día y hora específicos
  const getEventsForTimeSlot = (day: DateTime, hour: number) => {
    return weekEvents.filter((event: any) => {
      const eventDate = DateTime.fromISO(event.startDateTime);
      return eventDate.hasSame(day, 'day') && eventDate.hour === hour;
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

  // Nombres de meses en español
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Nombres de días en español
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const handleFormSaved = () => {
    invalidateAppointments();
    onChanged?.();
  };

  return (
    <div className="h-full bg-white flex">
      {/* Sidebar izquierdo */}
      {sidebarOpen && (
        <div className="w-80 bg-gray-50 border-r border-gray-200 space-y-4">
          {/* Logo Estudio Maker - ARRIBA */}
          <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center min-h-32">
            <img
              src="/assets/imgs/estudio_maker_black.PNG"
              alt="Estudio Maker"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Mini calendario */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-center mb-3">
              <div className="text-lg font-semibold text-gray-900">
                {monthNames[refDate.month - 1]}
              </div>
              <div className="text-sm text-gray-500">{refDate.year}</div>
            </div>
            
            {/* Grid de días */}
            <div className="grid grid-cols-7 gap-1 text-xs">
              {dayNames.map(day => (
                <div key={day} className="text-center text-gray-500 font-medium py-1">
                  {day}
                </div>
              ))}
              
              {/* Días del mes */}
              {Array.from({ length: 35 }, (_, i) => {
                const day = refDate.startOf('month').startOf('week').plus({ days: i });
                const isCurrentMonth = day.month === refDate.month;
                const isToday = day.hasSame(DateTime.now(), 'day');
                const isSelected = day.hasSame(selectedDate, 'day'); // Verificar si es el día seleccionado
                
                return (
                  <div
                    key={i}
                    className={`text-center py-1 rounded cursor-pointer hover:bg-gray-100 ${
                      isCurrentMonth 
                        ? isSelected
                          ? 'bg-blue-600 text-white font-bold' 
                          : isToday
                            ? 'bg-orange-500 text-white font-bold ring-2 ring-orange-300 shadow-sm'
                            : 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                    onClick={() => {
                      setSelectedDate(day); // Actualizar el día seleccionado
                      setRefDate(day); // Cambiar la fecha de referencia
                    }}
                    title={`Ir a ${day.toFormat('dd MMM yyyy')}`}
                  >
                    {day.day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mis calendarios */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Mis Calendarios</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Estudio Maker</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Personal</span>
              </div>
            </div>
          </div>

          {/* Botón de crear - ABAJO */}
          <button
            onClick={() => setCreating(DateTime.now().toISO())}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Crear
          </button>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-center">
            {/* Navegación centrada - Navegación mensual + semanal */}
            <div className="flex items-center gap-4">
              {/* Navegación mensual */}
              <button
                onClick={() => setRefDate(refDate.minus({ months: 1 }))}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Mes anterior"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              
              {/* Mes y año actual - Clickeable para selector rápido */}
              <div 
                className="text-center cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors"
                onClick={() => setShowMonthSelector(!showMonthSelector)}
              >
                <div className="text-xl font-semibold text-gray-900">
                  {monthNames[refDate.month - 1]}
                </div>
                <div className="text-sm text-gray-500">{refDate.year}</div>
              </div>
              
              <button
                onClick={() => setRefDate(refDate.plus({ months: 1 }))}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Mes siguiente"
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
              
              {/* Separador */}
              <div className="w-px h-8 bg-gray-300"></div>
              
              {/* Navegación semanal */}
              <button
                onClick={goToPrevious}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Semana anterior"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Hoy
              </button>
              
              <button
                onClick={goToNext}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Semana siguiente"
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
              
              {/* Semana actual */}
              <div className="text-lg font-medium text-gray-700">
                {`${weekDays[0].date.toFormat('dd MMM')} - ${weekDays[6].date.toFormat('dd MMM')}`}
              </div>
            </div>
          </div>
        </div>

        {/* Selector de mes/año */}
        {showMonthSelector && (
          <div className="border-b border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-center gap-4">
              {/* Selector de mes */}
              <select
                value={refDate.month}
                onChange={(e) => setRefDate(refDate.set({ month: Number(e.target.value) }))}
                className="border rounded-lg px-3 py-2 bg-white text-gray-900"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              
              {/* Selector de año */}
              <input
                type="number"
                value={refDate.year}
                onChange={(e) => setRefDate(refDate.set({ year: Number(e.target.value) }))}
                className="w-24 border rounded-lg px-3 py-2 bg-white text-gray-900 text-center"
                min="2020"
                max="2030"
              />
              
              {/* Botón para cerrar */}
              <button
                onClick={() => setShowMonthSelector(false)}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Calendario principal */}
        <div className="flex-1 overflow-auto">
          {view === 'week' ? (
            /* Vista semanal */
            <div className="grid grid-cols-8 h-full">
              {/* Columna de horas */}
              <div className="border-r border-gray-200">
                <div className="h-16 border-b border-gray-200"></div>
                {Array.from({ length: 12 }, (_, i) => {
                  const hour = i + 9; // Empezar a las 9 AM
                  return (
                    <div key={hour} className="h-20 border-b border-gray-200 px-2 py-1">
                      <div className="text-sm text-gray-500 font-medium">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Columnas de días */}
              {weekDays.map((day, dayIndex) => (
                <div key={dayIndex} className="border-r border-gray-200">
                  {/* Header del día */}
                  <div className={`h-16 border-b border-gray-200 p-2 text-center ${
                    day.isToday ? 'bg-blue-50' : ''
                  }`}>
                    <div className="text-sm font-medium text-gray-900">
                      {dayNames[day.date.weekday % 7]}
                    </div>
                    <div className={`text-lg font-semibold ${
                      day.isToday ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {day.date.day}
                    </div>
                  </div>

                  {/* Slots de tiempo */}
                  {Array.from({ length: 12 }, (_, i) => {
                    const hour = i + 9;
                    const events = getEventsForTimeSlot(day.date, hour);
                    
                    return (
                      <div key={hour} className="h-20 border-b border-gray-200 p-1 relative">
                        {events.map((event: any, eventIndex: number) => (
                          <div
                            key={event.id}
                            className={`absolute left-1 right-1 p-1 rounded text-xs text-white ${getEventColor(event.status)} cursor-pointer hover:opacity-80 transition-opacity`}
                            style={{
                              top: `${eventIndex * 20}px`,
                              zIndex: eventIndex + 1
                            }}
                            onClick={() => setEditing({
                              id: event.id,
                              start: event.startDateTime,
                              end: event.endDateTime || event.startDateTime
                            })}
                            title={`Clic para editar: ${event.title}`}
                          >
                            {event.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            /* Vista mensual */
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1">
                {/* Días de la semana */}
                {dayNames.map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
                    {day}
                  </div>
                ))}
                
                {/* Días del mes */}
                {Array.from({ length: 35 }, (_, i) => {
                  const day = refDate.startOf('month').startOf('week').plus({ days: i });
                  const isCurrentMonth = day.month === refDate.month;
                  const isToday = day.hasSame(DateTime.now(), 'day');
                  const dayEvents = weekEvents.filter((event: any) => {
                    const eventDate = DateTime.fromISO(event.startDateTime);
                    return eventDate.hasSame(day, 'day');
                  });
                  
                  return (
                    <div
                      key={i}
                      className={`min-h-[100px] p-2 border border-gray-200 ${
                        isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                      } ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isCurrentMonth 
                          ? isToday 
                            ? 'text-blue-600' 
                            : 'text-gray-900'
                          : 'text-gray-400'
                      }`}>
                        {day.day}
                      </div>
                      
                      {/* Eventos del día */}
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event: any) => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate ${getEventColor(event.status)} text-white cursor-pointer hover:opacity-80 transition-opacity`}
                            onClick={() => setEditing({
                              id: event.id,
                              start: event.startDateTime,
                              end: event.endDateTime || event.startDateTime
                            })}
                            title={`Clic para editar: ${event.title}`}
                          >
                            {event.title}
                          </div>
                        ))}
                        
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayEvents.length - 3} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

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
