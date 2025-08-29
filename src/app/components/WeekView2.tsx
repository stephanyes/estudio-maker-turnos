'use client';

import { useState, useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer, Views, Event } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'moment/locale/es';
import { DateTime } from 'luxon';
import { useUpdateAppointmentWithWeek, useCreateAppointmentWithWeek } from '@/lib/queries';
import { db } from '@/lib/supabase-db';
import AppointmentForm from './AppointmentForm';
import { useQueryClient } from '@tanstack/react-query';
import { useData, useDataInvalidation } from '@/app/context/DataProvider';


// Configurar moment para español
moment.locale('es');
const localizer = momentLocalizer(moment);

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
  [key: string]: any; // Permitir propiedades adicionales
};

type CalendarEvent = Event & {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Occ;
};

type EventDropInfo = {
  event: CalendarEvent;
  start: Date;
  end: Date;
  resourceId?: string;
};

type SlotInfo = {
  start: Date;
  end: Date;
  slots: Date[];
  action: 'select' | 'click' | 'doubleClick';
};

type CalendarResource = {
  resourceId: string;
  resourceTitle: string;
};

type EditTarget = { baseId: string; start: string; end: string; title?: string };

// Calendar con drag and drop tipado correctamente
// const DragAndDropCalendar = withDragAndDrop<CalendarEvent, CalendarResource>(Calendar);
const DragAndDropCalendar = Calendar; // Usar Calendar normal sin HOC problemático

type Props = { 
  onChanged?: () => void;
};

export default function WeekViewRBC({ onChanged }: Props) {
  const [refDate, setRefDate] = useState(DateTime.now());
  const [editing, setEditing] = useState<EditTarget | undefined>();
  const [creating, setCreating] = useState<string | undefined>();
  
  // 🎯 DataProvider para obtener todos los datos
  const { 
    appointments, 
    userProfiles, 
    loading,
    errors,
    hasErrors
  } = useData();
  const { invalidateAppointments } = useDataInvalidation();
  
  // Procesar ocurrencias de la semana actual usando los datos del DataProvider
  const items = useMemo(() => {
    if (!appointments.data.length) return [];
    
    // Simular la lógica de getOccurrences para la semana actual
    const startWeek = refDate.startOf('week');
    const endWeek = refDate.endOf('week');
    
    // Filtrar citas de la semana actual
    return appointments.data.filter((appointment: any) => {
      const appointmentDate = DateTime.fromISO(appointment.startDateTime);
      return appointmentDate >= startWeek && appointmentDate <= endWeek;
    }).map((appointment: any) => ({
      id: appointment.id,
      start: appointment.startDateTime,
      end: DateTime.fromISO(appointment.startDateTime).plus({ minutes: appointment.durationMin }).toISO()!,
      title: appointment.title,
      clientId: appointment.clientId,
      status: appointment.status,
      startedAt: appointment.startedAt,
      completedAt: appointment.completedAt,
      actualDurationMin: appointment.actualDurationMin,
      serviceId: appointment.serviceId,
      assignedTo: appointment.assignedTo,
    }));
  }, [appointments, refDate]);
  
  // Mutations para actualizar y crear citas
  const updateAppointmentMutation = useUpdateAppointmentWithWeek();
  const createAppointmentMutation = useCreateAppointmentWithWeek();
  
  // Logging para detectar errores en WeekView2
  if (hasErrors) {
    // console.log('🚨 WeekView2: DataProvider has errors:', errors);
  }

  // Logging para detectar errores en mutaciones
  if (updateAppointmentMutation.error) {
    // console.log('🚨 WeekView2: Update mutation error:', updateAppointmentMutation.error);
  }
  if (createAppointmentMutation.error) {
    // console.log('🚨 WeekView2: Create mutation error:', createAppointmentMutation.error);
  }

  // Logging para detectar cuando se muestra la pantalla de error
  // console.log('🔍 WeekView2: Render state:', {
  //   hasErrors,
  //   isCoreDataReady: true, // Asumiendo que siempre es true si llegamos aquí
  //   willShowError: hasErrors,
  //   willShowCalendar: !hasErrors
  // });

  if (hasErrors) {
    // console.log('🚨 WeekView2: Showing error screen with reload button');
    return (
      <div className="p-8">
        <div className="text-center text-red-500">
          <p className="mb-4">Error al cargar el calendario</p>
                  <button 
          onClick={() => {
            // console.log('🚨 WeekView2: Reload button clicked - this will reload the page');
            window.location.reload();
          }}
          className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500"
        >
          Reintentar
        </button>
        </div>
      </div>
    );
  }

  // Estado local para optimistic updates
  const [optimisticEvents, setOptimisticEvents] = useState<CalendarEvent[]>([]);
  const [isOptimisticUpdate, setIsOptimisticUpdate] = useState(false);

  // Mapa de nombres de empleados
  const employeeNameMap = useMemo(
    () => Object.fromEntries(userProfiles.map((p) => [p.id, p.name] as const)),
    [userProfiles]
  );
  const getEmployeeName = (id: string) => employeeNameMap[id] || `Usuario ${id.slice(0, 8)}`;

  // Convertir las citas a eventos del calendario
  const events = useMemo((): CalendarEvent[] => {
    // console.log('Items from DataProvider:', items);
    const baseEvents = items.map((occ: Occ) => {
      const employeeName = occ.assignedTo ? getEmployeeName(occ.assignedTo) : 'Sin asignar';
      const title = occ.title || 'Turno sin título';
      
      return {
        id: occ.id,
        title: `${title}\n👤 ${employeeName}`,
        start: new Date(occ.start),
        end: new Date(occ.end),
        resource: occ,
        // No usar resourceId - mostrar todo en un solo calendario
      };
    });

    // Si hay actualizaciones optimistas, aplicarlas y NO usar los datos de la DB
    if (isOptimisticUpdate && optimisticEvents.length > 0) {
      // console.log('Using optimistic events:', optimisticEvents.length);
      return optimisticEvents;
    }

    return baseEvents;
  }, [items, optimisticEvents, isOptimisticUpdate, getEmployeeName]);

  // No usar recursos - mostrar todo en un solo calendario
  const resources: CalendarResource[] = [];

  // Función para aplicar actualización optimista
  const applyOptimisticUpdate = useCallback((eventId: string, start: Date, end: Date) => {
    setOptimisticEvents(prevEvents => {
      const updatedEvents = prevEvents.length > 0 ? prevEvents : items.map((occ: Occ) => ({
      id: occ.id,
      title: occ.title || 'Turno sin título',
      start: new Date(occ.start),
      end: new Date(occ.end),
      resource: occ,
    }));

      return updatedEvents.map((event: CalendarEvent) => 
        event.id === eventId 
          ? { ...event, start, end }
          : event
      );
    });
    setIsOptimisticUpdate(true);
  }, [items]);

  // Función para revertir actualización optimista con rollback robusto
  const revertOptimisticUpdate = useCallback(() => {
    setIsOptimisticUpdate(false);
    setOptimisticEvents([]);
    
    // Forzar re-render de los datos
    invalidateAppointments();
  }, [invalidateAppointments]);

  // Handler para cuando se mueve un evento
  const handleEventDrop = useCallback(async ({ event, start, end }: EventDropInfo) => {
    // console.log('🎯 WeekView2: handleEventDrop STARTED', { event, start, end });
    // console.log('Event dropped:', { eventId: event.id, newStart: start, newEnd: end, newResource: event.resource, originalEvent: event });
    
    // Validar que no se mueva al pasado
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    if (start < oneHourAgo) {
      // console.log('❌ WeekView2: Cannot move to past, reverting');
      alert('No se pueden mover eventos al pasado.');
      return;
    }

    // Validar que no se mueva a un tiempo pasado en el mismo día
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    
    if (startDate.getTime() === today.getTime() && start < now) {
      // console.log('❌ WeekView2: Cannot move to past time today, reverting');
      alert('No se pueden mover eventos a un tiempo pasado en el mismo día.');
      return;
    }

    try {
      // console.log('🎯 WeekView2: Starting optimistic update...');
      // Aplicar actualización optimista
      applyOptimisticUpdate(event.id, start, end);

      // console.log('🎯 WeekView2: Starting database update...');
      // Detectar si es una ocurrencia recurrente
      const isRecurringOccurrence = event.id.includes('::');
      
      if (isRecurringOccurrence) {
        // console.log('🎯 WeekView2: Recurring occurrence detected');
        // 🎯 NUEVA LÓGICA SIMPLE: Romper el contrato recurrente
        
        // Mostrar confirmación
        const confirmed = window.confirm(
          'Este evento es parte de una serie recurrente. Al moverlo, se creará un evento individual en la nueva posición. ¿Continuar?'
        );
        
        if (!confirmed) {
          // console.log('❌ WeekView2: User cancelled recurring event move');
          revertOptimisticUpdate();
          return;
        }

        // Extraer información del evento recurrente
        const [baseAppointmentId, occurrenceTime] = event.id.split('::');
        
        // console.log('🎯 WeekView2: Breaking recurring contract for:', {
        //   baseAppointmentId,
        //   occurrenceTime,
        //   newStart: start,
        //   newEnd: end
        // });

        // Crear evento individual en la nueva posición
        const individualAppointment = {
          title: event.title || 'Evento sin título',
          startDateTime: start.toISOString(),
          durationMin: Math.round((end.getTime() - start.getTime()) / (1000 * 60)),
          isRecurring: false,
          serviceId: event.resource?.serviceId || '',
          clientId: event.resource?.clientId,
          assignedTo: event.resource?.assignedTo,
          status: event.resource?.status || 'pending',
          paymentMethod: event.resource?.paymentMethod || 'cash',
          finalPrice: event.resource?.finalPrice || 0,
          listPrice: event.resource?.listPrice || 0,
          discount: event.resource?.discount || 0,
          paymentStatus: event.resource?.paymentStatus || 'pending',
          paymentNotes: event.resource?.paymentNotes || '',
          notes: event.resource?.notes || '',
          timezone: 'America/Argentina/Buenos_Aires',
        };

        // console.log('🎯 WeekView2: Creating individual appointment:', individualAppointment);
        
        await createAppointmentMutation.mutateAsync(individualAppointment);
        // console.log('🎯 WeekView2: Individual appointment created successfully');

        // 🔑 CLAVE: Crear una excepción para que el evento recurrente NO aparezca en esta fecha
        const exceptionData = {
          appointmentId: baseAppointmentId,
          originalDateTime: occurrenceTime.replace('T', ' ').replace('.000-03:00', '+00:00'),
          type: 'skip' as const,
          newStartDateTime: undefined,
          newDurationMin: undefined,
        };

        // console.log('🎯 WeekView2: Creating exception to skip recurring occurrence:', exceptionData);
        
        try {
          await db.exceptions.add(exceptionData);
          // console.log('🎯 WeekView2: Exception created successfully');
        } catch (exceptionError) {
          // console.error('❌ WeekView2: Error creating exception:', exceptionError);
          // No fallar si la excepción falla - el evento individual ya se creó
        }

        // console.log('🎯 WeekView2: Recurring contract broken - individual event created and exception added');
        
      } else {
        // console.log('🎯 WeekView2: Normal appointment - updating directly');
        // Evento individual - actualizar normalmente
        const originalOcc = items.find((item: Occ) => item.id === event.id);
        if (!originalOcc) {
          throw new Error('Evento original no encontrado');
        }

        const baseAppointment = await db.appointments.get(originalOcc.id);
        if (!baseAppointment) {
          throw new Error('Cita base no encontrada');
        }

        const updatedAppointment = {
          ...baseAppointment,
          startDateTime: start.toISOString(),
          durationMin: Math.round((end.getTime() - start.getTime()) / (1000 * 60)),
        };

        // console.log('🎯 WeekView2: Updating appointment:', updatedAppointment);

        await updateAppointmentMutation.mutateAsync({
          id: originalOcc.id,
          appointment: updatedAppointment,
        });
        
        // console.log('🎯 WeekView2: Appointment updated successfully');
      }

      // console.log('🎯 WeekView2: Database update completed, invalidating cache...');
      // 🚀 OPTIMIZACIÓN: Invalidar solo el cache del DataProvider
      invalidateAppointments();
      
      // console.log('🎯 WeekView2: Cache invalidated, calling onChanged...');
      onChanged?.();
      
      // console.log('🎯 WeekView2: handleEventDrop completed successfully');
      
    } catch (error) {
      // console.error('❌ WeekView2: Error in handleEventDrop:', error);
      // Revertir cambios optimistas en caso de error
      revertOptimisticUpdate();
      alert('Error al mover la cita. Por favor, intenta de nuevo.');
    }
  }, [items, createAppointmentMutation, updateAppointmentMutation, invalidateAppointments, onChanged, applyOptimisticUpdate, revertOptimisticUpdate]);

  // Handler para cuando se redimensiona un evento
  const handleEventResize = useCallback(async (args: any) => {
    const { event, start, end } = args;
    // console.log('Event resized:', {
    //   eventId: event.id,
    //   newStart: start,
    //   newEnd: end,
    //   originalEvent: event.resource
    // });

    // Aplicar actualización optimista inmediatamente
    applyOptimisticUpdate(event.id, start, end);

    try {
      // Obtener la cita original de la base de datos
      const originalOcc = event.resource;
      const baseId = originalOcc.id.split('::')[0]; // Para citas recurrentes
      
      // Calcular la nueva duración en minutos
      const durationMin = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      
      // Obtener la cita base de la base de datos
      const baseAppointment = await db.appointments.get(baseId);
      if (!baseAppointment) {
        throw new Error('No se encontró la cita base');
      }
      
      // Preparar los datos actualizados
      const updatedAppointment = {
        ...baseAppointment,
        startDateTime: start.toISOString(),
        durationMin: durationMin,
      };

      // Actualizar en la base de datos
      await updateAppointmentMutation.mutateAsync({
        appointment: updatedAppointment
      });

      // console.log('Cita redimensionada exitosamente');
      
      // 🚀 OPTIMIZACIÓN: Invalidar solo el cache del DataProvider
      invalidateAppointments();
      
      // Limpiar estado optimista después de confirmación exitosa
      revertOptimisticUpdate();
    } catch (error) {
      // console.error('Error redimensionando cita:', error);
      // Revertir cambios optimistas en caso de error
      revertOptimisticUpdate();
      alert('Error al redimensionar la cita. Por favor, intenta de nuevo.');
    }
  }, [updateAppointmentMutation, invalidateAppointments, applyOptimisticUpdate, revertOptimisticUpdate]);

  // Handler para seleccionar un slot (crear nueva cita)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    console.log('🎯 Slot selected:', slotInfo);
    
    // Abrir el modal de creación con la fecha/hora seleccionada
    setCreating(slotInfo.start.toISOString());
  }, []);

  // Handler para seleccionar un evento (editar)
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    // console.log('Event selected:', event);
    
    // Obtener la cita original
    const occ = event.resource;
    const baseId = occ.id.split('::')[0]; // Para citas recurrentes
    
    // Abrir el modal de edición
    setEditing({
      baseId,
      start: occ.start,
      end: occ.end,
      title: occ.title,
    });
  }, []);

  // Handler para cuando se guarda el formulario
  const handleFormSaved = useCallback(() => {
    setEditing(undefined);
    onChanged?.();
  }, [onChanged]);

  // Personalizar el formato de las horas
  const formats = useMemo(() => ({
    timeGutterFormat: 'HH:mm',
    eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => 
      `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
    dayFormat: 'ddd DD/MM',
    dayHeaderFormat: 'dddd DD/MM/YYYY',
  }), []);

  // Personalizar mensajes en español
  const messages = useMemo(() => ({
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    showMore: (total: any) => `+ Ver más (${total})`
  }), []);

  // Estilo personalizado para los eventos según su estado y empleado asignado
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const occ = event.resource;
    
    // Color de fondo según el estado
    let backgroundColor = '#6b7280'; // Default gray for unknown status
    let borderColor = '#6b7280'; // Default gray for unassigned
    
    // Determinar color de fondo basado en el estado
    switch (occ.status) {
      case 'done':
        backgroundColor = '#10b981'; // green for completed
        break;
      case 'cancelled':
        backgroundColor = '#ef4444'; // red for cancelled
        break;
      case 'pending':
        backgroundColor = '#3b82f6'; // blue for pending
        break;
      default:
        backgroundColor = '#6b7280'; // gray for unknown/unassigned
    }
    
    // Color de borde basado en el empleado asignado
    if (occ.assignedTo) {
      // Generar color único basado en el ID del empleado
      const hue = Math.abs(occ.assignedTo.split('').reduce((acc: number, char: string) => char.charCodeAt(0) + ((acc << 5) - acc), 0)) % 360;
      borderColor = `hsl(${hue}, 70%, 50%)`;
    } else {
      // Sin asignar - borde gris
        borderColor = '#6b7280';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '3px',
        borderStyle: 'solid',
        color: 'white',
        borderRadius: '8px',
        fontSize: '12px',
        padding: '4px 8px',
        fontWeight: '500',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
      }
    };
  }, []);

  if (loading.core) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full" />
          <span className="ml-3">Cargando calendario...</span>
        </div>
      </div>
    );
  }

  if (hasErrors) {
    return (
      <div className="p-8">
        <div className="text-center text-red-500">
          <p className="mb-4">Error al cargar el calendario</p>
          <button 
          onClick={() => window.location.reload()}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header personalizado */}
      <div className="mb-4 space-y-4 text-center">
        {/* Navegación y título */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold capitalize">
            {moment(refDate.toJSDate()).format('MMMM YYYY')}
          </h2>
          
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setRefDate(refDate.minus({ weeks: 1 }))}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 text-sm font-medium shadow-sm"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setRefDate(DateTime.now())}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 transition-all duration-200 text-white font-medium text-sm shadow-md"
            >
              Hoy
            </button>
            <button
              onClick={() => setRefDate(refDate.plus({ weeks: 1 }))}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 text-sm font-medium shadow-sm"
            >
              Siguiente →
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-600 font-medium">
              {events.length} citas esta semana
            </span>
            {(updateAppointmentMutation.isPending || createAppointmentMutation.isPending) && (
              <span className="text-sm text-blue-500">Actualizando...</span>
            )}
            {isOptimisticUpdate && (
              <span className="text-sm text-green-500">✓ Cambios aplicados</span>
            )}
          </div>
        </div>
      </div>

      {/* Estado/Leyenda */}
      <div className="mb-4 space-y-3 text-center">
        {/* Leyenda de estados */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-blue-300 rounded-md shadow-sm"></div>
            <span className="font-medium">Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-emerald-300 rounded-md shadow-sm"></div>
            <span className="font-medium">Completada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-rose-400 to-rose-600 border-2 border-rose-300 rounded-md shadow-sm"></div>
            <span className="font-medium">Cancelada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-slate-400 to-slate-600 border-2 border-slate-300 rounded-md shadow-sm"></div>
            <span className="font-medium">Sin asignar</span>
          </div>
        </div>
        
        {/* Explicación */}
        <div className="text-xs text-gray-500">
          💡 Color de fondo = estado, Borde = empleado (cada empleado tiene su color único)
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg border shadow-sm" style={{ height: '700px' }}>
        <DragAndDropCalendar
          localizer={localizer}
          events={events}
          defaultView={Views.WEEK}
          view={Views.WEEK}
          views={[Views.WEEK, Views.DAY]}
          step={15}
          timeslots={4}
          min={new Date(2024, 0, 1, 9, 0)} // 9:00 AM
          max={new Date(2024, 0, 1, 22, 0)} // 10:00 PM
          date={refDate.toJSDate()}
          onNavigate={(date: any) => setRefDate(DateTime.fromJSDate(date) as DateTime<true>)}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable={true} // 🎯 HABILITAR selección de slots para crear eventos
          // onEventDrop={handleEventDrop} // Removido temporalmente
          // onEventResize={handleEventResize} // Removido temporalmente
          // resizable // Removido temporalmente
          formats={formats}
          messages={messages}
          eventPropGetter={eventStyleGetter}
          style={{ height: '100%' }}
          className="rbc-calendar"
        />
      </div>



      {/* Modal de edición */}
      {editing && (
        <AppointmentForm
          defaultStart={editing.start}
          editingBaseId={editing.baseId}
          occurrenceStartISO={editing.start}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            handleFormSaved();
          }}
        />
      )}

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
    </div>
  );
}