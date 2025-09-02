'use client';
import { useEffect, useState, useMemo } from 'react';
import { DateTime } from 'luxon';
import { isSlotAvailable } from '@/lib/schedule';
import { 
  useCreateAppointmentWithPayment, 
  useUpdateAppointmentWithPayment,
  useUpdateAppointmentStatus,
  useDeleteAppointmentWithWeek
} from '@/lib/queries';
import { db, calculateFinalPrice, calculateActualDuration } from '@/lib/supabase-db';
import ClientSelector from './ClientSelector';
import { supabase } from '@/lib/supabase';
import { useData, useDataInvalidation } from '@/app/context/DataProvider';
import { useAuth } from '@/app/context/AuthContext';

type Props = {
  defaultStart?: string;
  editingBaseId?: string;
  occurrenceStartISO?: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function AppointmentForm({
  defaultStart,
  editingBaseId,
  occurrenceStartISO,
  onClose,
  onSaved,
}: Props) {
  // Log removido para optimización
  const [title, setTitle] = useState('');
  const [durationMin, setDurationMin] = useState(30);
  const [startISO, setStartISO] = useState(defaultStart ?? DateTime.now().toISO()!);
  const [isRecurring, setIsRecurring] = useState(false);
  const [freq, setFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [interval, setInterval] = useState(1);
  const [byweekday, setByweekday] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // 🆕 SIMPLIFICACIÓN: Reemplazar serviceId por campos manuales
  const [serviceName, setServiceName] = useState<string>(''); // Nombre del servicio manual
  const [servicePrice, setServicePrice] = useState<number | ''>(''); // Precio manual del servicio
  
  // 🆕 MANTENER serviceId para compatibilidad durante transición
  const [serviceId, setServiceId] = useState<string>('');
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<'pending' | 'done' | 'cancelled'>('pending');


  // 🆕 Estados para pago
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'cancelled'>('pending');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [customDiscount, setCustomDiscount] = useState<number | undefined>(undefined);
  
  // 🎯 Estado para preservar precio original
  const [originalListPrice, setOriginalListPrice] = useState<number | undefined>(undefined);

  // 🆕 Estados para empleado asignado
  const [assignedTo, setAssignedTo] = useState<string | undefined>(undefined);

  // React Query hooks
  const { services, userProfiles, loading, hasErrors } = useData();
  const { user } = useAuth();
  const { invalidateStats } = useDataInvalidation();
  const servicesLoading = loading.core;
  const profilesLoading = loading.staff;
  
  // 🎯 Si hay errores de datos, mostrar mensaje
  if (hasErrors) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl shadow-xl space-y-4 w-full max-w-sm">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error al cargar datos
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              No se pudieron cargar los servicios y empleados necesarios para crear la cita.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }
  const createMutation = useCreateAppointmentWithPayment();
  const updateMutation = useUpdateAppointmentWithPayment();
  const statusMutation = useUpdateAppointmentStatus();
  const deleteMutation = useDeleteAppointmentWithWeek();

  // 🎯 Optimización: Memoizar cálculos costosos
  const memoizedServices = useMemo(() => services || [], [services]);
  const memoizedUserProfiles = useMemo(() => userProfiles || [], [userProfiles]);
  
  // 🎯 Optimización: Memoizar validaciones
  const isFormValid = useMemo(() => {
    // 🆕 SIMPLIFICACIÓN: Validar que haya nombre de servicio y precio
    return serviceName.trim() && Number(servicePrice) > 0 && durationMin > 0 && startISO;
  }, [serviceName, servicePrice, durationMin, startISO]);
  //   occurrenceStartISO
  // });

  // 🆕 SIMPLIFICACIÓN: Usar precio manual en lugar de servicio seleccionado
  const selectedService = services?.find((s: any) => s.id === serviceId);
  
  // 🎯 SIMPLIFICACIÓN: Usar precio manual o precio guardado
  const effectiveListPrice = originalListPrice ?? (Number(servicePrice) || 0);
  
  const priceCalculation = effectiveListPrice > 0 ? calculateFinalPrice(
    effectiveListPrice, 
    paymentMethod, 
    customDiscount
  ) : { finalPrice: 0, discount: 0 };
  
  // Variable para mostrar precio actual del servicio
  const currentServicePrice = selectedService ? selectedService.price : 0;

  // helpers de estilo
  const inputCls =
    'mt-1 w-full rounded-lg border border-zinc-300 ' +
    'bg-white text-zinc-900 ' +
    'placeholder-zinc-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

  const chipBase = "px-3 py-1 rounded-full border text-sm transition-colors";
  const chipActive = "bg-sky-500 text-white border-sky-500 hover:bg-sky-600";
  const chipInactive = "bg-white border-sky-300 hover:bg-sky-100";

  const days = [
    { label: 'L', value: 0 },
    { label: 'M', value: 1 },
    { label: 'X', value: 2 },
    { label: 'J', value: 3 },
    { label: 'V', value: 4 },
    { label: 'S', value: 5 },
    { label: 'D', value: 6 },
  ];

  useEffect(() => {
    if (!editingBaseId && !assignedTo) {
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            setAssignedTo(user.id);
          }
        } catch (error) {
          // console.log('No se pudo obtener el usuario actual:', error);
        }
      })();
    }
  }, [editingBaseId, assignedTo]);

  // Cargar datos si es edición
  useEffect(() => {
    if (!editingBaseId) return;
    (async () => {
      const base = await db.appointments.get(editingBaseId);
      if (!base) return;
      setTitle(base.title ?? '');
      setDurationMin(base.durationMin);
      setIsRecurring(base.isRecurring);

      if (base.isRecurring && base.rrule) {
        setFreq(base.rrule.freq);
        setInterval(base.rrule.interval ?? 1);
        setByweekday(base.rrule.byweekday ?? []);
      }
      setStartISO(occurrenceStartISO ?? base.startDateTime);
      setServiceId(base.serviceId ?? '');
      
      // 🆕 SIMPLIFICACIÓN: Cargar nombre y precio del servicio si existe
      if (base.serviceId) {
        const service = await db.services.get(base.serviceId);
        if (service) {
          setServiceName(service.name);
          setServicePrice(service.price);
        }
      }
      
      // 🆕 SIMPLIFICACIÓN: Cargar nombre y precio del servicio manual si existe
      if (base.serviceName) {
        setServiceName(base.serviceName);
      }
      
      if (base.listPrice) {
        setServicePrice(base.listPrice);
      }
      
      setClientId(base.clientId);
      setStatus(base.status ?? 'pending');
      setAssignedTo(base.assignedTo);

      // 🆕 SIMPLIFICACIÓN: Generar título automáticamente si no existe
      if (base.serviceName && base.title === 'Turno' && base.clientId) {
        // Buscar el cliente para generar el título
        const client = await db.clients.get(base.clientId);
        if (client) {
          const generatedTitle = `${client.name} - ${base.serviceName}`;
          setTitle(generatedTitle);
        }
      }



      // 🆕 Cargar datos de pago
      setPaymentMethod(base.paymentMethod ?? 'cash');
      setPaymentStatus(base.paymentStatus ?? 'pending');
      setPaymentNotes(base.paymentNotes ?? '');
      if (base.discount !== undefined) {
        setCustomDiscount(base.discount);
      }
      
      // 🎯 PRESERVAR PRECIO ORIGINAL: Solo cargar precio si no existe
      if (base.listPrice !== undefined) {
        // Si ya tiene precio guardado, preservarlo
        setOriginalListPrice(base.listPrice);
      }
    })();
  }, [editingBaseId, occurrenceStartISO]);

  // Auto-generar título basado en cliente y servicio (solo para nuevos turnos)
  useEffect(() => {
    if (clientId && serviceName && (!title || title === 'Turno') && !editingBaseId) {
      (async () => {
        const client = await db.clients.get(clientId);
        
        if (client && serviceName) {
          const generatedTitle = `${client.name} - ${serviceName}`;
          setTitle(generatedTitle);
        }
      })();
    }
  }, [clientId, title, editingBaseId]); // 🆕 Solo para nuevos turnos

  // Cuando arranca repetición semanal → no autoselecciona día
  useEffect(() => {
    if (!editingBaseId && isRecurring && freq === 'WEEKLY') {
      setByweekday([]);
    }
  }, [startISO, isRecurring, freq, editingBaseId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!serviceName.trim()) {
      setError('Tenés que escribir qué servicio estás dando.');
      return;
    }

    if (!servicePrice || Number(servicePrice) <= 0) {
      setError('Tenés que especificar el precio del servicio.');
      return;
    }

    if (isRecurring && freq === 'WEEKLY' && byweekday.length === 0) {
      setError('Tenés que seleccionar al menos un día de la semana.');
      return;
    }

    const free = await isSlotAvailable(startISO, durationMin, editingBaseId, assignedTo ?? null);
    if (!free) {
      setError('Ese horario ya está ocupado por otro turno.');
      return;
    }

    // 🆕 calcular timing si se marca como "done"
    const nowISO = DateTime.now().toISO()!;
    let timing: {
      startedAt?: string;
      completedAt?: string;
      actualDurationMin?: number;
    } = {};

    if (status === 'done') {
      // Si el turno está en el futuro, arrancamos desde ahora para evitar negativo
      const scheduledStart = DateTime.fromISO(startISO);
      const startForCalcISO = (scheduledStart > DateTime.now() ? DateTime.now() : scheduledStart).toISO()!;
      const duration = calculateActualDuration(startForCalcISO, nowISO) ?? 0;

      timing = {
        startedAt: startForCalcISO,
        completedAt: nowISO,
        actualDurationMin: duration,
      };
    }

    // 🎯 Asegurar consistencia entre status y paymentStatus
    const finalPaymentStatus = status === 'cancelled' ? 'cancelled' : paymentStatus;

    const payload = {
      title: title || 'Turno',
      startDateTime: startISO,
      durationMin,
      isRecurring,
      rrule: isRecurring ? { freq, interval, byweekday } : undefined,
      // 🆕 SIMPLIFICACIÓN: Usar nombre del servicio en lugar de ID
      serviceName: serviceName.trim(),
      serviceId: null, // Enviar null en lugar de string vacío
      clientId,

      //  🆕 estado + empleado asignado
      status,
      assignedTo: assignedTo || undefined,

      ...timing,

      
      // 🆕 Campos de pago
      paymentMethod,
      finalPrice: priceCalculation.finalPrice,
      listPrice: effectiveListPrice, // 🎯 Usar precio efectivo (original o actual)
      discount: priceCalculation.discount,
      paymentStatus: finalPaymentStatus, // 🎯 Usar el status final validado
      paymentNotes: paymentNotes || undefined,
    };



    try {
      if (editingBaseId) {
        // Si solo estamos cambiando el status, usar el smart status update
        const baseAppointment = await db.appointments.get(editingBaseId);
        if (baseAppointment && 
            baseAppointment.status !== status && 
            baseAppointment.title === payload.title &&
            baseAppointment.startDateTime === payload.startDateTime &&
            baseAppointment.durationMin === payload.durationMin &&
            baseAppointment.serviceName === payload.serviceName &&
            baseAppointment.clientId === payload.clientId &&
            baseAppointment.assignedTo === payload.assignedTo) {
          
          // Solo cambio de status - usar smart update
          await statusMutation.mutateAsync({
            appointmentId: editingBaseId,
            newStatus: status,
            occurrenceStartISO: occurrenceStartISO
          });
        } else {
          // Cambios múltiples - usar update normal
          await updateMutation.mutateAsync({
            appointment: { ...payload, id: editingBaseId }
          });
        }
      } else {
        await createMutation.mutateAsync(payload);
      }
      
      // 🎯 Invalidar estadísticas después de guardar exitosamente
      invalidateStats();
      onSaved();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al guardar el turno');
    }
  }

  async function confirmDelete(choice: 'uno' | 'todos' | 'actual') {
    if (!editingBaseId) return;
    
    try {
      const base = await db.appointments.get(editingBaseId);
      if (!base) return;

      if (base.isRecurring) {
        if (choice === 'uno' && occurrenceStartISO) {
          await db.exceptions.add({
            appointmentId: base.id,
            originalDateTime: occurrenceStartISO,
            type: 'skip',
          });
        } else if (choice === 'todos') {
          await deleteMutation.mutateAsync(base.id);
        } else if (choice === 'actual' && occurrenceStartISO) {
          await db.appointments.put({
            ...base,
            startDateTime: occurrenceStartISO,
            isRecurring: false,
            rrule: undefined,
          });
          await deleteMutation.mutateAsync(base.id);
        }
      } else {
        await deleteMutation.mutateAsync(base.id);
      }

      setShowDeleteModal(false);
      
      // 🎯 Invalidar estadísticas después de eliminar
      invalidateStats();
      onSaved();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al eliminar el turno');
    }
  }

  const isAnyMutationLoading = 
    createMutation.isPending || 
    updateMutation.isPending || 
    statusMutation.isPending ||
    deleteMutation.isPending;

  const isFormDisabled = servicesLoading || profilesLoading || isAnyMutationLoading;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl max-h-[95vh] overflow-y-auto"
      >
        {/* Header */}
                  <div className="flex items-center justify-between gap-3 p-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold">
            {editingBaseId ? 'Editar turno' : 'Nuevo turno'}
            {isFormDisabled && (
              <span className="ml-2 text-sm text-zinc-500">
                {servicesLoading ? 'Cargando...' : 'Guardando...'}
              </span>
            )}
          </h2>
          {editingBaseId && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-2.5 py-1.5 rounded-lg border border-red-300 
                         text-red-700 hover:bg-red-50 text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed"
              title="Eliminar o cancelar"
              disabled={isFormDisabled}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar/Cancelar'}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {error && (
            <p className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 text-sm">
              {error}
            </p>
          )}

          {/* Mutation errors */}
          {createMutation.error && (
            <p className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 text-sm">
              Error al crear: {createMutation.error.message}
            </p>
          )}
          {updateMutation.error && (
            <p className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 text-sm">
              Error al actualizar: {updateMutation.error.message}
            </p>
          )}

          {/* Selector de Cliente */}
          <ClientSelector
            selectedClientId={clientId}
            onClientSelected={setClientId}
          />

          <label className="block">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Título (opcional)</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              placeholder={clientId ? "Se auto-genera con cliente y servicio" : "Descripción del turno"}
              disabled={isFormDisabled}
            />
          </label>

          {/* 🆕 SIMPLIFICACIÓN: Servicio manual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                ¿Qué servicio estás dando?
              </span>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className={inputCls}
                placeholder="Ej: Corte, Color, Peinado..."
                disabled={isFormDisabled}
              />
            </label>
            
            <label className="block">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Precio del servicio</span>
              <input
                type="number"
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value === '' ? '' : Number(e.target.value))}
                className={inputCls}
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={isFormDisabled}
              />
            </label>
          </div>

          {/* 🆕 Empleado asignado */}
          <label className="block">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Empleado asignado
              {!editingBaseId && (
                <span className="text-xs text-green-600 ml-2">
                  (se auto-asigna a ti por defecto)
                </span>
              )}
            </span>
            {profilesLoading ? (
              <div className="mt-1 h-10 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-lg"></div>
            ) : (
              <select
                value={assignedTo || ''}
                onChange={(e) => setAssignedTo(e.target.value || undefined)}
                className={inputCls}
                disabled={isFormDisabled}
              >
                <option value="">Sin asignar</option>
                {userProfiles?.map((profile: any) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} ({profile.role})
                  </option>
                ))}
              </select>
            )}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Inicio</span>
              <input
                type="datetime-local"
                value={DateTime.fromISO(startISO).toFormat("yyyy-LL-dd'T'HH:mm")}
                onChange={(e) =>
                  setStartISO(
                    DateTime.fromFormat(e.target.value, "yyyy-LL-dd'T'HH:mm")
                      .toISO({ suppressMilliseconds: true })!
                  )
                }
                className={inputCls}
                disabled={isFormDisabled}
              />
            </label>
            <label className="block">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Duración (min)</span>
              <input
                type="number"
                min={15}
                step={15}
                value={durationMin === null || Number.isNaN(durationMin) ? "" : durationMin}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setDurationMin(NaN);
                  } else {
                    setDurationMin(+val);
                  }
                }}
                className={inputCls}
                disabled={isFormDisabled}
              />
            </label>
          </div>

          {/* Seccion terminar turno */}
          <label className="block">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Estado del turno</span>
            <select
              value={status}
              onChange={(e) => {
                const newStatus = e.target.value as 'pending' | 'done' | 'cancelled';
                setStatus(newStatus);
                
                // 🎯 Lógica de payment status basada en el estado del turno
                if (newStatus === 'cancelled') {
                  setPaymentStatus('cancelled');
                } else if (newStatus === 'pending' && paymentStatus === 'cancelled') {
                  // Si se vuelve a "pendiente" desde "cancelado", resetear a "pending"
                  setPaymentStatus('pending');
                }
              }}
              className={inputCls}
              disabled={isFormDisabled}
            >
              <option value="pending">Pendiente</option>
              <option value="done">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <p className="text-xs text-zinc-500 mt-1">
              Si marcás “Completado”, al guardar calculamos la duración real automáticamente (desde la hora programada hasta ahora).
            </p>
          </label>

          {/* Sección de Pago */}
          <div className="space-y-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-neutral-900/40 p-4">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Información de pago</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Método de pago</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'transfer')}
                  className={inputCls}
                  disabled={isFormDisabled}
                >
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Estado del pago</span>
                {status === 'cancelled' ? (
                  // 🎯 Si el turno está cancelado, mostrar como deshabilitado
                  <div className="relative">
                    <select
                      value="cancelled"
                      className={`${inputCls} bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed`}
                      disabled={true}
                    >
                      <option value="cancelled">Cancelado</option>
                    </select>
                    <div className="absolute inset-0 bg-transparent"></div>
                  </div>
                ) : (
                  // 🎯 Si el turno NO está cancelado, permitir solo pending/paid
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as 'pending' | 'paid')}
                    className={inputCls}
                    disabled={isFormDisabled}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagado</option>
                  </select>
                )}
                <p className="text-xs text-zinc-500 mt-1">
                  {status === 'cancelled' 
                    ? '🔒 Estado de pago bloqueado: turno cancelado'
                    : '💡 Solo se puede cambiar entre "Pendiente" y "Pagado"'
                  }
                </p>
              </label>
            </div>

            {/* Precios calculados */}
            {effectiveListPrice > 0 && (
              <div className={`rounded-lg p-3 border ${
                status === 'cancelled' 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                  : 'bg-white dark:bg-neutral-800 border-zinc-200 dark:border-zinc-700'
              }`}>
                <div className="space-y-2 text-sm">
                  {status === 'cancelled' && (
                    <div className="text-center py-2 mb-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <span className="text-red-700 dark:text-red-300 font-medium">❌ TURNO CANCELADO</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Precio de lista:</span>
                    <span className={status === 'cancelled' ? 'line-through text-red-600' : ''}>
                      ${effectiveListPrice}
                    </span>
                  </div>
                  
                  {/* Solo mostrar descuentos si NO está cancelado */}
                  {status !== 'cancelled' && priceCalculation.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento ({priceCalculation.discount}%):</span>
                      <span>-${Math.round(effectiveListPrice * priceCalculation.discount / 100)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Total a pagar:</span>
                    <span className={status === 'cancelled' ? 'text-red-600 font-bold' : ''}>
                      {status === 'cancelled' ? 'CANCELADO' : `$${priceCalculation.finalPrice}`}
                    </span>
                  </div>
                  
                  {status !== 'cancelled' && paymentMethod === 'cash' && priceCalculation.discount > 0 && (
                    <div className="text-xs text-green-600 mt-2">
                      💰 Descuento por efectivo aplicado automáticamente
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Descuento personalizado */}
            <label className="block">
              <span className={`text-sm ${
                status === 'cancelled' 
                  ? 'text-gray-400 dark:text-gray-500' 
                  : 'text-zinc-700 dark:text-zinc-300'
              }`}>
                Descuento personalizado (%)
                <span className="text-xs text-zinc-500 ml-1">
                  {status === 'cancelled' 
                    ? '(no aplica para turnos cancelados)'
                    : '(opcional, deja vacío para usar automático)'
                  }
                </span>
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={customDiscount ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomDiscount(val === '' ? undefined : Number(val));
                }}
                className={`${inputCls} ${
                  status === 'cancelled' 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : ''
                }`}
                disabled={isFormDisabled || status === 'cancelled'}
                placeholder={status === 'cancelled' ? 'No aplica' : `Auto: ${paymentMethod === 'cash' ? '10' : '0'}%`}
              />
            </label>

            <label className="block">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Notas de pago (opcional)</span>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className={inputCls}
                rows={2}
                disabled={isFormDisabled}
                placeholder="Ej: Cliente pidió factura, pago con descuento especial..."
              />
            </label>
          </div>

          {/* Repetición */}
          <label className={`flex items-center gap-2 ${
            status === 'cancelled' 
              ? 'text-gray-400 dark:text-gray-500' 
              : 'text-zinc-700 dark:text-zinc-300'
          }`}>
            <input
              type="checkbox"
              className="accent-sky-600 disabled:cursor-not-allowed"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              disabled={isFormDisabled || status === 'cancelled'}
            />
            <span>
              Repetir
              {status === 'cancelled' && (
                <span className="text-xs text-gray-500 ml-1">(no disponible para turnos cancelados)</span>
              )}
            </span>
          </label>

          {isRecurring && (
            <div className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-neutral-900/40 p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Frecuencia</span>
                  <select
                    value={freq}
                    onChange={(e) => setFreq(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY')}
                    className={inputCls}
                    disabled={isFormDisabled}
                  >
                    <option value="DAILY">Diaria</option>
                    <option value="WEEKLY">Semanal</option>
                    <option value="MONTHLY">Mensual</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Cada (intervalo)</span>
                  <input
                    type="number"
                    min={1}
                    value={interval}
                    onChange={(e) => setInterval(+e.target.value)}
                    className={inputCls}
                    disabled={isFormDisabled}
                  />
                </label>
              </div>

              {freq === 'WEEKLY' && (
                <div className="flex flex-wrap gap-2">
                  {days.map(({ label, value }) => {
                    const isActive = byweekday.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          !isFormDisabled && setByweekday((w) =>
                            w.includes(value) ? w.filter((x) => x !== value) : [...w, value]
                          )
                        }
                        className={`${chipBase} ${isActive ? chipActive : chipInactive} ${
                          isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={isFormDisabled}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                "Todos los jueves" → Semanal / 1 / J — "Cada 15 días" → Semanal / 2 (día de inicio).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isAnyMutationLoading}
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isFormDisabled}
          >
            {isAnyMutationLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                {createMutation.isPending ? 'Creando...' : 'Guardando...'}
              </>
            ) : (
              'Guardar'
            )}
          </button>
        </div>
      </form>

      {/* Modal de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-xl space-y-4 w-full max-w-sm">
            <h3 className="text-lg font-semibold">¿Qué querés hacer?</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Este turno es parte de una serie recurrente.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => confirmDelete('uno')}
                className="w-full px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50"
                disabled={deleteMutation.isPending}
              >
                Cancelar solo este
              </button>
              <button
                onClick={() => confirmDelete('todos')}
                className="w-full px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
                disabled={deleteMutation.isPending}
              >
                Borrar toda la serie
              </button>
              <button
                onClick={() => confirmDelete('actual')}
                className="w-full px-3 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-400 disabled:opacity-50"
                disabled={deleteMutation.isPending}
              >
                Convertir en único
              </button>
            </div>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="mt-3 w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-neutral-800 disabled:opacity-50"
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </button>
            
            {deleteMutation.isPending && (
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                <div className="animate-spin w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full"></div>
                Procesando eliminación...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}