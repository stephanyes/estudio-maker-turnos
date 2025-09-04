'use client';
import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { useUpdateAppointmentWithTiming } from '@/lib/queries';
import { Appointment, calculateActualDuration } from '@/lib/supabase-db';
import { Play, Pause, Square, Clock, CheckCircle, Ban } from 'lucide-react';

type ServiceTimerProps = {
  service: Appointment;
  type: 'appointment';
  onUpdate?: () => void;
};

const EARLY_GRACE_MIN = 10;  // podés ajustar
const LATE_GRACE_MIN  = 10;  // podés ajustar

export default function ServiceTimerControl({ service, type, onUpdate }: ServiceTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [autoClosing, setAutoClosing] = useState(false);

  const updateAppointmentMutation = useUpdateAppointmentWithTiming();

  // Estado actual
  const hasStarted = (service as Appointment).startedAt;
  const hasCompleted = (service as Appointment).completedAt;

  const actualDuration = hasStarted && hasCompleted 
    ? calculateActualDuration(hasStarted, hasCompleted)
    : null;

  // Ventanas de programación
  const scheduledStartISO = (service as Appointment).startDateTime;
  const estimatedDuration = (service as Appointment).durationMin;

  const scheduledStart = DateTime.fromISO(scheduledStartISO);
  const scheduledEnd   = scheduledStart.plus({ minutes: estimatedDuration });
  const canStartWindow =
    DateTime.now() >= scheduledStart.minus({ minutes: EARLY_GRACE_MIN }) &&
    DateTime.now() <= scheduledEnd.plus({ minutes: LATE_GRACE_MIN });

  const isExpiredBeyondGrace = DateTime.now() > scheduledEnd.plus({ minutes: LATE_GRACE_MIN });

  const isCancelled = (service as any).status === 'cancelled';

  // Timer effect + autocierre si se pasó del fin + gracia
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isRunning && startTime) {
      interval = setInterval(async () => {
        const now = DateTime.now();
        const start = DateTime.fromISO(startTime);
        const elapsed = now.diff(start, 'seconds').seconds;
        setElapsedTime(Math.floor(elapsed));

        // autocierre si pasó del fin + gracia
        if (!autoClosing && now > scheduledEnd.plus({ minutes: LATE_GRACE_MIN })) {
          setAutoClosing(true);
          try {
            await handleCompleteInternal(now.toISO()!, startTime);
          } finally {
            setAutoClosing(false);
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, startTime, scheduledEnd.toISO(), autoClosing]);

  // Inicializar timer si ya está iniciado
  useEffect(() => {
    if (hasStarted && !hasCompleted) {
      setIsRunning(true);
      setStartTime(hasStarted);
      
      const now = DateTime.now();
      const start = DateTime.fromISO(hasStarted);
      const elapsed = now.diff(start, 'seconds').seconds;
      setElapsedTime(Math.floor(elapsed));
    }
  }, [hasStarted, hasCompleted]);

  const handleStart = async () => {
    // Bloquear inicio si vencido o cancelado o fuera de ventana
    if (isCancelled || !canStartWindow || isExpiredBeyondGrace) return;

    const now = DateTime.now().toISO();
    setStartTime(now);
    setIsRunning(true);
    setElapsedTime(0);

    try {
      // Importante: NO marcamos done al iniciar; solo seteamos startedAt.
      await updateAppointmentMutation.mutateAsync({
        appointment: {
          ...(service as Appointment),
          startedAt: now,
        }
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error starting timer:', error);
      setIsRunning(false);
      setStartTime(null);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    // Solo se puede reanudar si todavía estamos dentro de la ventana (o no venció)
    if (!isExpiredBeyondGrace && !isCancelled) {
      setIsRunning(true);
    }
  };

  const handleCompleteInternal = async (nowISO: string, actualStartISO: string) => {
    const duration = calculateActualDuration(actualStartISO, nowISO);
    setIsRunning(false);

    try {
      await updateAppointmentMutation.mutateAsync({
        appointment: {
          ...(service as Appointment),
          startedAt: actualStartISO,
          completedAt: nowISO,
          actualDurationMin: duration,
          status: 'done'
        }
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error completing service:', error);
    }
  };

  const handleComplete = async () => {
    const nowISO = DateTime.now().toISO();
    const actualStart = startTime || hasStarted;
    if (!actualStart) return;
    await handleCompleteInternal(nowISO!, actualStart);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Si ya está completado, mostrar resumen
  if (hasCompleted) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle className="w-4 h-4" />
        <span>Completado: {actualDuration ?? '-'}min</span>
        <span className="text-xs text-zinc-500">
          ({hasStarted ? DateTime.fromISO(hasStarted).toFormat('HH:mm') : '--'} - {DateTime.fromISO(hasCompleted).toFormat('HH:mm')})
        </span>
      </div>
    );
  }

  const isOvertime = isRunning && DateTime.now() > scheduledEnd;

  // Reglas de habilitación de controles
  const showPlay = !hasStarted && !hasCompleted && !isCancelled;
  const disablePlay = !canStartWindow || isExpiredBeyondGrace;
  const disableComplete = updateAppointmentMutation.isPending;
  const disableRunningControls = disableComplete || isCancelled;

  return (
    <div className="flex items-center gap-2" data-timer-control="true">
      {/* Display de tiempo */}
      <div className="flex items-center gap-1 text-sm">
        <Clock className="w-4 h-4" />
        <span className={`font-mono ${isOvertime ? 'text-red-600' : 'text-zinc-700 dark:text-zinc-300'}`}>
          {formatTime(elapsedTime)}
        </span>
        <span className="text-xs text-zinc-500">/ {estimatedDuration}min</span>
      </div>

      {/* Controles */}
      <div className="flex gap-1">
        {showPlay && (
          <button
            onClick={handleStart}
            disabled={disablePlay || updateAppointmentMutation.isPending}
            className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded disabled:opacity-50"
            title={disablePlay ? 'Fuera de horario' : 'Iniciar servicio'}
          >
            <Play className="w-4 h-4" />
          </button>
        )}

        {isRunning && (
          <>
            <button
              onClick={handlePause}
              disabled={disableRunningControls}
              className="p-1 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 rounded disabled:opacity-50"
              title="Pausar"
            >
              <Pause className="w-4 h-4" />
            </button>
            <button
              onClick={handleComplete}
              disabled={disableComplete}
              className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded disabled:opacity-50"
              title="Completar servicio"
            >
              <Square className="w-4 h-4" />
            </button>
          </>
        )}

        {!isRunning && hasStarted && !hasCompleted && (
          <>
            <button
              onClick={handleResume}
              disabled={isExpiredBeyondGrace || isCancelled}
              className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded disabled:opacity-50"
              title={isExpiredBeyondGrace ? 'Ya venció el horario' : 'Reanudar'}
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={handleComplete}
              disabled={disableComplete}
              className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded disabled:opacity-50"
              title="Completar servicio"
            >
              <Square className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Indicadores */}
      {isExpiredBeyondGrace && !hasStarted && !hasCompleted && (
        <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600 dark:bg-neutral-800/50 dark:text-zinc-300 rounded-full">
          <Ban className="w-3 h-3" />
          Vencido
        </span>
      )}

      {isOvertime && (
        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-300 rounded-full">
          +{Math.floor((elapsedTime - estimatedDuration * 60) / 60)}min
        </span>
      )}
    </div>
  );
}
