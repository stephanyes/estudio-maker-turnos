import { db } from '@/lib/supabase-db';
import { DateTime } from 'luxon';

// Actualizar stats del cliente cuando una cita se completa
export async function markVisitCompleted(clientId: string, appointmentId: string) {
  if (!clientId) return; // Skip para walk-ins sin cliente

  const client = await db.clients.get(clientId);
  if (!client) return;

  const now = DateTime.now().toISO()!;

  // SOLO actualizar stats del cliente (no tocar appointments)
  await db.clients.update(clientId, {
    lastVisit: now,
    totalVisits: client.totalVisits + 1,
  });

  // SOLO crear registro en historial
  await db.clientHistory.add({
    clientId,
    eventType: 'visit_completed',
    appointmentId,
    timestamp: now,
    notes: `Visita #${client.totalVisits + 1} completada`,
  });

  console.log(`📊 Cliente ${client.name}: visita completada (total: ${client.totalVisits + 1})`);
}

// Registrar cancelación de cita
export async function markAppointmentCancelled(clientId: string, appointmentId: string, reason?: string) {
  if (!clientId) return; // Skip para walk-ins sin cliente

  const client = await db.clients.get(clientId);
  if (!client) return;

  const now = DateTime.now().toISO()!;

  // SOLO incrementar contador de cancelaciones (no tocar appointments)
  await db.clients.update(clientId, {
    totalCancellations: client.totalCancellations + 1,
  });

  // SOLO crear registro en historial
  await db.clientHistory.add({
    clientId,
    eventType: 'appointment_cancelled',
    appointmentId,
    timestamp: now,
    notes: reason || `Cancelación #${client.totalCancellations + 1}`,
  });

  console.log(`❌ Cliente ${client.name}: cita cancelada (total cancelaciones: ${client.totalCancellations + 1})`);
}

// Registrar cuando se envía un recordatorio
export async function markReminderSent(clientId: string, method: 'whatsapp' | 'instagram' | 'phone') {
  const client = await db.clients.get(clientId);
  if (!client) return;

  const now = DateTime.now().toISO()!;

  // Actualizar fecha de último recordatorio
  await db.clients.update(clientId, {
    reminderSent: now,
  });

  // Crear registro en historial
  await db.clientHistory.add({
    clientId,
    eventType: 'reminder_sent',
    timestamp: now,
    notes: `Recordatorio enviado por ${method}`,
  });

  console.log(`📱 Cliente ${client.name}: recordatorio enviado por ${method}`);
}

// Obtener historial completo de un cliente - CORREGIDO para nueva API
export async function getClientHistory(clientId: string) {
  return await db.clientHistory
    .where('clientId')
    .equals(clientId)
    .reverse()
    .sortBy('timestamp');
}

// Obtener clientes que no vienen hace X días
export async function getClientsAtRisk(daysSinceLastVisit: number = 30) {
  const cutoffDate = DateTime.now().minus({ days: daysSinceLastVisit });

  const allClients = await db.clients.toArray();

  return allClients
    .filter((client) => {
      // Clientes que nunca vinieron
      if (!client.lastVisit) {
        const createdDate = DateTime.fromISO(client.createdAt);
        return createdDate < cutoffDate;
      }

      // Clientes cuya última visita fue hace más de X días
      const lastVisitDate = DateTime.fromISO(client.lastVisit);
      return lastVisitDate < cutoffDate;
    })
    .map((client) => {
      const daysSinceLastVisit = client.lastVisit
        ? Math.floor(DateTime.now().diff(DateTime.fromISO(client.lastVisit), 'days').days)
        : Math.floor(DateTime.now().diff(DateTime.fromISO(client.createdAt), 'days').days);

      return {
        ...client,
        daysSinceLastVisit,
        riskLevel: daysSinceLastVisit > 60 ? 'high' : daysSinceLastVisit > 45 ? 'medium' : 'low',
      };
    })
    .sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);
}

// Estadísticas generales de clientes
export async function getClientStats() {
  const allClients = await db.clients.toArray();
  const totalClients = allClients.length;

  const activeClients = allClients.filter((c) => {
    if (!c.lastVisit) return false;
    const lastVisit = DateTime.fromISO(c.lastVisit);
    const thirtyDaysAgo = DateTime.now().minus({ days: 30 });
    return lastVisit > thirtyDaysAgo;
  }).length;

  const atRisk = allClients.filter((c) => {
    const cutoff = DateTime.now().minus({ days: 30 });
    if (!c.lastVisit) {
      return DateTime.fromISO(c.createdAt) < cutoff;
    }
    return DateTime.fromISO(c.lastVisit) < cutoff;
  }).length;

  const totalVisits = allClients.reduce((sum, c) => sum + c.totalVisits, 0);
  const totalCancellations = allClients.reduce((sum, c) => sum + c.totalCancellations, 0);

  return {
    totalClients,
    activeClients,
    atRisk,
    totalVisits,
    totalCancellations,
    cancellationRate:
      totalVisits + totalCancellations > 0
        ? Math.round((totalCancellations / (totalVisits + totalCancellations)) * 100)
        : 0,
  };
}