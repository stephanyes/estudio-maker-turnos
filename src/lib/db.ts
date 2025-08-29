import Dexie, { Table } from 'dexie';

export interface Client {
  id: string;
  name: string;
  phone?: string;
  // Nuevos campos para tracking
  lastVisit?: string;           // ISO string de última cita completada
  totalVisits: number;          // contador automático
  totalCancellations: number;   // contador de cancelaciones
  contactMethod?: 'whatsapp' | 'instagram' | 'phone';
  contactHandle?: string;       // @usuario o número completo
  notes?: string;              // observaciones libres
  createdAt: string;           // cuándo se agregó el cliente
  reminderSent?: string;       // última fecha de recordatorio enviado
}

export interface Service {
  id: string;
  name: string;   // ej: "Corte", "Corte + Barba"
  price: number;  // ej: 8000
}

export interface Appointment {
  id: string;
  clientId?: string;
  serviceId: string;      // referencia a Service
  title?: string;          // opcional, si querés mostrarlo plano
  startDateTime: string;   // ISO
  durationMin: number;     // 30|45|60|custom
  isRecurring: boolean;
  rrule?: {
    freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    interval: number;
    byweekday?: number[];
    until?: string;
    count?: number;
  };
  timezone?: string;
  notes?: string;
  status?: 'pending' | 'done' | 'cancelled';
}

export interface Exception {
  id: string;
  appointmentId: string;
  originalDateTime: string;
  type: 'skip' | 'move';
  newStartDateTime?: string;
  newDurationMin?: number;
}

// Nueva tabla para historial de eventos del cliente
export interface ClientHistory {
  id: string;
  clientId: string;
  eventType: 'visit_completed' | 'appointment_cancelled' | 'reminder_sent' | 'client_created';
  appointmentId?: string;      // referencia a la cita si aplica
  timestamp: string;           // cuándo ocurrió el evento
  notes?: string;             // detalles adicionales del evento
}

export class BarberDB extends Dexie {
  clients!: Table<Client, string>;
  services!: Table<Service, string>;
  appointments!: Table<Appointment, string>;
  exceptions!: Table<Exception, string>;
  clientHistory!: Table<ClientHistory, string>;  // Nueva tabla

  constructor() {
    super('studio_maker_db');
    
    // IMPORTANTE: Incrementar versión de 3 a 4
    this.version(4).stores({
      clients: 'id, name, phone, lastVisit, totalVisits, contactMethod, createdAt',
      services: 'id, name, price',
      appointments: 'id, startDateTime, isRecurring, status, serviceId, clientId',
      exceptions: 'id, appointmentId, originalDateTime',
      clientHistory: 'id, clientId, eventType, timestamp, appointmentId',
    }).upgrade(tx => {
      // Migración para clientes existentes
      return tx.table('clients').toCollection().modify(client => {
        if (!client.totalVisits) client.totalVisits = 0;
        if (!client.totalCancellations) client.totalCancellations = 0;
        if (!client.createdAt) client.createdAt = new Date().toISOString();
      });
    });
    
    // Mantener versión 3 para compatibilidad con datos existentes
    this.version(3).stores({
      clients: 'id, name, phone',
      services: 'id, name, price',
      appointments: 'id, startDateTime, isRecurring, status, serviceId',
      exceptions: 'id, appointmentId, originalDateTime',
    });
  }
}

export const db = new BarberDB();