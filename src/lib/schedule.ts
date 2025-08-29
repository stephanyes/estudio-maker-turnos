import { RRule } from 'rrule';
import { DateTime } from 'luxon';
import { db, Appointment } from './supabase-db';
import { markVisitCompleted, markAppointmentCancelled } from './client-tracking';

function toRRule(a: Appointment) {
  if (!a.isRecurring || !a.rrule) return null;
  const start = DateTime.fromISO(a.startDateTime);
  const mapWeekday = (n: number) => [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU][n];
  return new RRule({
    freq: { DAILY: RRule.DAILY, WEEKLY: RRule.WEEKLY, MONTHLY: RRule.MONTHLY }[a.rrule.freq],
    interval: a.rrule.interval ?? 1,
    byweekday: a.rrule.byweekday?.map(mapWeekday),
    dtstart: start.toJSDate(),
    until: a.rrule.until ? DateTime.fromISO(a.rrule.until).toJSDate() : undefined,
    count: a.rrule.count
  });
}

/**
 * Valida si un slot está disponible para el empleado indicado.
 * - Permite solaparse con otros empleados (admin vs staff).
 * - Bloquea solape si es el mismo empleado, o si ambos están sin asignar.
 *
 * @param startISO      Inicio propuesto (ISO)
 * @param durationMin   Duración en minutos
 * @param ignoreBaseId  ID base a ignorar (al editar)
 * @param assignedTo    Empleado asignado (opcional). Si es undefined/null, se trata como “sin asignar”.
 */
export async function isSlotAvailable(
  startISO: string,
  durationMin: number,
  ignoreBaseId?: string,
  assignedTo?: string | null
) {
  
  const start = DateTime.fromISO(startISO);
  const endISO = start.plus({ minutes: durationMin }).toISO()!;
  const dayStart = start.startOf('day').toISO()!;
  const dayEnd = start.endOf('day').toISO()!;

  const occs = await getOccurrences(dayStart, dayEnd);

  // Mapear baseId -> assignedTo del turno base
  const baseIds = Array.from(new Set(occs.map(o => o.id.split('::')[0])));
  const baseApps = await Promise.all(baseIds.map(id => db.appointments.get(id)));
  const assignedByBase: Record<string, string | null> = {};
  baseApps.forEach((a, idx) => {
    assignedByBase[baseIds[idx]] = a?.assignedTo ?? null;
  });

  const wanted = assignedTo ?? null;

  // Choque sólo cuando es el mismo empleado (o ambos sin asignar)
  const hits = occs.some(o => {
    const baseId = o.id.split('::')[0];
    if (ignoreBaseId && baseId === ignoreBaseId) return false;

    const occAssignee = assignedByBase[baseId] ?? null;
    if ((occAssignee ?? null) !== wanted) return false; // otro empleado → no bloquea

    return overlaps(startISO, endISO, o.start, o.end);
  });

  return !hits;
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const A = new Date(aStart).getTime();
  const B = new Date(aEnd).getTime();
  const C = new Date(bStart).getTime();
  const D = new Date(bEnd).getTime();
  return A < D && C < B;
}

// ✨ NUEVA FUNCIÓN: Marcar una cita como completada con tracking automático
export async function markAppointmentCompleted(appointmentId: string, occurrenceStart?: string) {
  const appointment = await db.appointments.get(appointmentId);
  if (!appointment) return;

  if (!appointment.isRecurring) {
    // Cita única - actualizar status directamente
    await db.appointments.update(appointmentId, { status: 'done' });
    
    // Tracking automático del cliente
    if (appointment.clientId) {
      await markVisitCompleted(appointment.clientId, appointmentId);
    }
  } else {
    // Para citas recurrentes, esto se maneja en getOccurrences automáticamente
    // pero podríamos crear una excepción para marcar esta ocurrencia específica como 'done'
    console.log('Cita recurrente marcada como completada para la fecha:', occurrenceStart);
    
    if (appointment.clientId && occurrenceStart) {
      await markVisitCompleted(appointment.clientId, appointmentId);
    }
  }
}

// ✨ NUEVA FUNCIÓN: Cancelar una cita con tracking automático
export async function cancelAppointment(appointmentId: string, reason?: string, occurrenceStart?: string) {
  const appointment = await db.appointments.get(appointmentId);
  if (!appointment) return;

  if (!appointment.isRecurring) {
    // Cita única - actualizar status
    await db.appointments.update(appointmentId, { status: 'cancelled' });
    
    // Tracking automático de cancelación
    if (appointment.clientId) {
      await markAppointmentCancelled(appointment.clientId, appointmentId, reason);
    }
  } else if (occurrenceStart) {
    // Cita recurrente - crear excepción de tipo skip
    await db.exceptions.add({
      appointmentId,
      originalDateTime: occurrenceStart,
      type: 'skip'
    });
    
    // Tracking de cancelación
    if (appointment.clientId) {
      await markAppointmentCancelled(appointment.clientId, appointmentId, reason);
    }
  }
}

// Genera ocurrencias visibles entre rangeStartISO y rangeEndISO
export async function getOccurrences(rangeStartISO: string, rangeEndISO: string) {
  const [apps, exs] = await Promise.all([
    db.appointments.toArray(),
    db.exceptions.toArray()
  ]);

  const out: Array<{
    id: string;
    start: string;
    end: string;
    title?: string;
    clientId?: string;
    serviceId: string;
    status?: string;
    price?: number;
    // 🆕 Agregar los campos de timer
    startedAt?: string;
    completedAt?: string;
    actualDurationMin?: number;
  }> = [];

  const rStart = DateTime.fromISO(rangeStartISO);
  const rEnd   = DateTime.fromISO(rangeEndISO);
  const now    = DateTime.now();

  for (const a of apps) {
    const duration = a.durationMin;
    const start = DateTime.fromISO(a.startDateTime);
    const end   = start.plus({ minutes: duration });

    // ---- Caso: no recurrente ----
    if (!a.isRecurring) {
      let status = a.status ?? 'pending';
      
      // ✨ AUTO-TRACKING: Si cambió de pending a done, registrar visita
      if (status === 'pending' && end < now) {
        status = 'done';
        await db.appointments.update(a.id, { status });
        
        // Tracking automático cuando se marca como completada
        if (a.clientId) {
          await markVisitCompleted(a.clientId, a.id);
        }
      }
      
      if (end > rStart && start < rEnd) {
        out.push({
          id: a.id,
          start: start.toISO()!,
          end: end.toISO()!,
          title: a.title,
          serviceId: a.serviceId,
          clientId: a.clientId,
          status,
          // 🆕 Incluir los campos de timer
          startedAt: a.startedAt,
          completedAt: a.completedAt,
          actualDurationMin: a.actualDurationMin,
        });
      }
      continue;
    }

    // ---- Caso: recurrente ----
    const rule = toRRule(a);
    if (!rule) continue;
    const dates = rule.between(rStart.toJSDate(), rEnd.toJSDate(), true);

    for (const d of dates) {
      const s = DateTime.fromJSDate(d);
      const keyISO = s.toISO()!.replace('Z', '+00:00'); // Normalizar formato para coincidir con PostgreSQL
      const related = exs.filter(
        (x) => x.appointmentId === a.id && x.originalDateTime === keyISO
      );
      if (related.find((x) => x.type === "skip")) continue;

      const move = related.find((x) => x.type === "move");
      const start2 = move?.newStartDateTime
        ? DateTime.fromISO(move.newStartDateTime)
        : s;
      const dur = move?.newDurationMin ?? duration;
      const end2 = start2.plus({ minutes: dur });

      // Status calculado por ocurrencia
      let status: 'pending' | 'done' = 'pending';
      if (end2 < now) {
        status = 'done';
        
        // ✨ AUTO-TRACKING para citas recurrentes completadas
        if (a.clientId) {
          // Solo trackear si no se ha trackeado antes para esta ocurrencia
          const existingHistory = await db.clientHistory
            .where('appointmentId')
            .equals(a.id)
            .first();
            
          if (!existingHistory) {
            await markVisitCompleted(a.clientId, a.id);
          }
        }
      }

      out.push({
        id: a.id + "::" + keyISO,
        start: start2.toISO()!,
        end: end2.toISO()!,
        title: a.title,
        serviceId: a.serviceId,
        clientId: a.clientId,
        status,
        // 🆕 Para citas recurrentes, los campos de timer vienen del appointment base
        // NOTA: Para ocurrencias recurrentes individuales, estos campos son compartidos
        // Si necesitas tracking por ocurrencia individual, requerirías un modelo de datos diferente
        startedAt: a.startedAt,
        completedAt: a.completedAt,
        actualDurationMin: a.actualDurationMin,
      });
    }
  }

  return out;
}