import { supabase } from './supabase';

// Types existentes actualizados
export type Client = {
  id: string;
  name: string;
  phone?: string;
  lastVisit?: string;
  totalVisits: number;
  totalCancellations: number;
  contactMethod?: 'whatsapp' | 'instagram' | 'phone';
  contactHandle?: string;
  notes?: string;
  createdAt: string;
  reminderSent?: string;
};

export type Service = {
  id: string;
  name: string;
  price: number;
  createdBy?: string;
};

export type Exception = {
  id: string;
  appointmentId: string;
  originalDateTime: string;
  type: 'skip' | 'move';
  newStartDateTime?: string;
  newDurationMin?: number;
};

export type ClientHistory = {
  id: string;
  clientId: string;
  eventType: 'visit_completed' | 'appointment_cancelled' | 'reminder_sent' | 'client_created';
  appointmentId?: string;
  timestamp: string;
  notes?: string;
};

export type Appointment = {
  id: string;
  clientId?: string;
  serviceId: string;
  title?: string;
  startDateTime: string;
  durationMin: number;
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
  
  // Campos de pago existentes
  paymentMethod?: 'cash' | 'card' | 'transfer';
  finalPrice?: number;
  listPrice?: number;
  discount?: number;
  paymentStatus?: 'pending' | 'paid' | 'cancelled';
  paymentNotes?: string;
  
  // 🆕 Nuevos campos de tiempo y empleado
  actualDurationMin?: number; // duración real vs estimada
  startedAt?: string; // momento real de inicio
  completedAt?: string; // momento real de finalización  
  assignedTo?: string; // empleado asignado
};

// WalkIn actualizado con campos de tiempo y empleado
export type WalkIn = {
  id: string;
  date: string; // YYYY-MM-DD format
  clientId?: string;
  serviceId?: string;
  serviceName?: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  finalPrice: number;
  listPrice: number;
  discount?: number;
  timestamp: string;
  notes?: string;
  duration?: number; // duración estimada
  
  // 🆕 Nuevos campos de tiempo y empleado
  startedAt?: string; // momento real de inicio
  completedAt?: string; // momento real de finalización
  servedBy?: string; // empleado que atendió
};

// 🆕 Nuevo tipo para horarios de empleados
export type StaffSchedule = {
  id: string;
  businessId: string;
  userId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// 🆕 UserProfile extendido para mejor manejo de empleados
export type UserProfile = {
  id: string;
  businessId: string;
  role: 'admin' | 'staff';
  name: string;
  createdAt: string;
};

// 🆕 Helper para calcular precio con descuento
export function calculateFinalPrice(
  listPrice: number, 
  paymentMethod: 'cash' | 'card' | 'transfer',
  customDiscount?: number
): { finalPrice: number; discount: number } {
  const discountPercent = customDiscount ?? (paymentMethod === 'cash' ? 10 : 0);
  const discount = (listPrice * discountPercent) / 100;
  const finalPrice = listPrice - discount;
  
  return {
    finalPrice: Math.round(finalPrice),
    discount: discountPercent
  };
}

// Helper para obtener usuario actual
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Perfil no encontrado');
  return { user, profile };
}

// Convertidores actualizados
function toClient(data: any): Client {
  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    lastVisit: data.last_visit,
    totalVisits: data.total_visits || 0,
    totalCancellations: data.total_cancellations || 0,
    contactMethod: data.contact_method,
    contactHandle: data.contact_handle,
    notes: data.notes,
    createdAt: data.created_at,
    reminderSent: data.reminder_sent,
  };
}

function toService(data: any): Service {
  return {
    id: data.id,
    name: data.name,
    price: Math.round(data.price / 100), // de centavos a pesos
    createdBy: data.created_by,
  };
}

// 🆕 Convertidor actualizado con campos de pago
function toAppointment(data: any): Appointment {
  if (!data.id) throw new Error('Appointment data missing required ID field');

  return {
    id: data.id,
    clientId: data.client_id,
    serviceId: data.service_id,
    title: data.title,
    startDateTime: data.start_date_time,
    durationMin: data.duration_min,
    isRecurring: data.is_recurring || false,
    rrule: data.rrule,
    timezone: data.timezone,
    notes: data.notes,
    status: data.status || 'pending',

    // ⇩ conservar 0 correctamente
    paymentMethod: data.payment_method,
    finalPrice: typeof data.final_price === 'number' ? Math.round(data.final_price / 100) : undefined,
    listPrice:  typeof data.list_price  === 'number' ? Math.round(data.list_price  / 100) : undefined,
    discount: data.discount,
    paymentStatus: data.payment_status || 'pending',
    paymentNotes: data.payment_notes,

    actualDurationMin: data.actual_duration_min,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    assignedTo: data.assigned_to,
  };
}


// 🆕 Convertidor para WalkIn
function toWalkIn(data: any): WalkIn {
  return {
    id: data.id,
    date: data.date,
    clientId: data.client_id,
    serviceId: data.service_id,
    serviceName: data.service_name,
    paymentMethod: data.payment_method,
    finalPrice: Math.round(data.final_price / 100),
    listPrice: Math.round(data.list_price / 100),
    discount: data.discount || 0,
    timestamp: data.timestamp,
    notes: data.notes,
    duration: data.duration || 30,
    
    // 🆕 Campos de tiempo y empleado
    startedAt: data.started_at,
    completedAt: data.completed_at,
    servedBy: data.served_by,
  };
}

// API de clients sin cambios
export const clients = {
  async clear(): Promise<void> {
    const { profile } = await getCurrentUser();
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('business_id', profile.business_id);

    if (error) throw error;
  },

  async toArray(): Promise<Client[]> {
    const { profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('business_id', profile.business_id)
      .order('name');
    
    if (error) throw error;
    return data.map(toClient);
  },

  async orderBy(field: string): Promise<Client[]> {
    const { profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('business_id', profile.business_id)
      .order(field === 'name' ? 'name' : 'created_at');
    
    if (error) throw error;
    return data.map(toClient);
  },

  async get(id: string): Promise<Client | undefined> {
    const { profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('business_id', profile.business_id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toClient(data) : undefined;
  },

  async add(client: Omit<Client, 'id'>): Promise<string> {
    const { profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('clients')
      .insert([{
        business_id: profile.business_id,
        name: client.name,
        phone: client.phone || null,
        last_visit: client.lastVisit || null,
        total_visits: client.totalVisits || 0,
        total_cancellations: client.totalCancellations || 0,
        contact_method: client.contactMethod || null,
        contact_handle: client.contactHandle || null,
        notes: client.notes || null,
        reminder_sent: client.reminderSent || null,
      }])
      .select('id')
      .single();
    
    if (error) throw error;
    return data.id;
  },

  async update(id: string, changes: Partial<Client>): Promise<void> {
    const { profile } = await getCurrentUser();
    const updateData: any = {};
    
    if (changes.name !== undefined) updateData.name = changes.name;
    if (changes.phone !== undefined) updateData.phone = changes.phone;
    if (changes.lastVisit !== undefined) updateData.last_visit = changes.lastVisit;
    if (changes.totalVisits !== undefined) updateData.total_visits = changes.totalVisits;
    if (changes.totalCancellations !== undefined) updateData.total_cancellations = changes.totalCancellations;
    if (changes.contactMethod !== undefined) updateData.contact_method = changes.contactMethod;
    if (changes.contactHandle !== undefined) updateData.contact_handle = changes.contactHandle;
    if (changes.notes !== undefined) updateData.notes = changes.notes;
    if (changes.reminderSent !== undefined) updateData.reminder_sent = changes.reminderSent;

    const { error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', profile.business_id);
    
    if (error) throw error;
  },

  async count(): Promise<number> {
    const { profile } = await getCurrentUser();
    const { count, error } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', profile.business_id);
    
    if (error) throw error;
    return count || 0;
  }
};

// API de services sin cambios
export const services = {
  async count(): Promise<number> {
    const { profile } = await getCurrentUser();
    const { count, error } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', profile.business_id);

    if (error) throw error;
    return count ?? 0;
  },

  async clear(): Promise<void> {
    const { profile } = await getCurrentUser();
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('business_id', profile.business_id);

    if (error) throw error;
  },

  async toArray(): Promise<Service[]> {
    const { profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', profile.business_id)
      .order('name');

    if (error) throw error;
    return data.map(toService);
  },

  async get(id: string): Promise<Service | undefined> {
    const { profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .eq('business_id', profile.business_id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toService(data) : undefined;
  },

  async insert(service: Omit<Service, 'id'>): Promise<string> {
    const { user, profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('services')
      .insert([{
        business_id: profile.business_id,
        created_by: service.createdBy ?? user.id,
        name: service.name,
        price: Math.round(service.price * 100),
      }])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async put(service: Service): Promise<void> {
    const { user, profile } = await getCurrentUser();
    const { error } = await supabase
      .from('services')
      .upsert([{
        id: service.id,
        business_id: profile.business_id,
        created_by: service.createdBy ?? user.id,
        name: service.name,
        price: Math.round(service.price * 100),
      }]);

    if (error) throw error;
  },

  async update(id: string, changes: Partial<Service>): Promise<void> {
    const { profile } = await getCurrentUser();
    const updateData: any = {};

    if (changes.name !== undefined) updateData.name = changes.name;
    if (changes.price !== undefined) updateData.price = Math.round(changes.price * 100);
    if (changes.createdBy !== undefined) updateData.created_by = changes.createdBy;

    const { error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', profile.business_id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { profile } = await getCurrentUser();
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .eq('business_id', profile.business_id);

    if (error) throw error;
  },

  async add(service: Omit<Service, 'id'>): Promise<string> {
    const { user, profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('services')
      .insert([{
        business_id: profile.business_id,
        created_by: service.createdBy ?? user.id,
        name: service.name,
        price: Math.round(service.price * 100),
      }])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },
};

// 🆝 Appointments API actualizada con campos de pago
export const appointments = {
  where(field: string) {
    return {
      between: (fromISO: string, toISO: string) => ({
        toArray: async (): Promise<Appointment[]> => {
          const { profile } = await getCurrentUser();
          const column =
            field === 'startDateTime' ? 'start_date_time' : field;

          const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('business_id', profile.business_id)
            .gte(column, fromISO)
            .lt(column, toISO)
            .order('start_date_time', { ascending: true });

          if (error) throw error;
          return data.map(toAppointment);
        },
      }),
    };
  },

  async clear(): Promise<void> {
    const { profile } = await getCurrentUser();
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('business_id', profile.business_id);

    if (error) throw error;
  },

  async count(): Promise<number> {
    const { profile } = await getCurrentUser();
    const { count, error } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', profile.business_id);

    if (error) throw error;
    return count ?? 0;
  },

  async add(appointment: Omit<Appointment, 'id'>): Promise<string> {
    const { user, profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        business_id: profile.business_id,
        created_by: user.id,
        client_id: appointment.clientId ?? null,
        service_id: appointment.serviceId,
        title: appointment.title ?? null,
        start_date_time: appointment.startDateTime,
        duration_min: appointment.durationMin,
        is_recurring: appointment.isRecurring,
        rrule: appointment.rrule ?? null,
        timezone: appointment.timezone ?? null,
        notes: appointment.notes ?? null,
        status: appointment.status ?? 'pending',

        // ⇩ conservar 0 correctamente
        payment_method: appointment.paymentMethod ?? null,
        final_price: appointment.finalPrice !== undefined ? Math.round(appointment.finalPrice * 100) : null,
        list_price:  appointment.listPrice  !== undefined ? Math.round(appointment.listPrice  * 100) : null,
        discount:    appointment.discount ?? null,
        payment_status: appointment.paymentStatus ?? 'pending',
        payment_notes: appointment.paymentNotes ?? null,

        actual_duration_min: appointment.actualDurationMin ?? null,
        started_at: appointment.startedAt ?? null,
        completed_at: appointment.completedAt ?? null,
        assigned_to: appointment.assignedTo ?? null,
      }])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async toArray(): Promise<Appointment[]> {
    const { profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('business_id', profile.business_id)
      .order('start_date_time');
    
    if (error) throw error;
    return data.map(toAppointment);
  },

  async get(id: string): Promise<Appointment | undefined> {
    const { profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .eq('business_id', profile.business_id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toAppointment(data) : undefined;
  },

  async insert(appointment: Omit<Appointment, 'id'>): Promise<string> {
    const { user, profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        business_id: profile.business_id,
        created_by: user.id,
        client_id: appointment.clientId ?? null,
        service_id: appointment.serviceId,
        title: appointment.title ?? null,
        start_date_time: appointment.startDateTime,
        duration_min: appointment.durationMin,
        is_recurring: appointment.isRecurring,
        rrule: appointment.rrule ?? null,
        timezone: appointment.timezone ?? null,
        notes: appointment.notes ?? null,
        status: appointment.status ?? 'pending',

        // ⇩ conservar 0 correctamente
        payment_method: appointment.paymentMethod ?? null,
        final_price: appointment.finalPrice !== undefined ? Math.round(appointment.finalPrice * 100) : null,
        list_price:  appointment.listPrice  !== undefined ? Math.round(appointment.listPrice  * 100) : null,
        discount:    appointment.discount ?? null,
        payment_status: appointment.paymentStatus ?? 'pending',
        payment_notes: appointment.paymentNotes ?? null,

        actual_duration_min: appointment.actualDurationMin ?? null,
        started_at: appointment.startedAt ?? null,
        completed_at: appointment.completedAt ?? null,
        assigned_to: appointment.assignedTo ?? null,
      }])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  // 🆕 Put actualizado con nuevos campos
  async put(appointment: Appointment): Promise<void> {
    const existing = await this.get(appointment.id);
    if (!existing) {
      await this.insert(appointment);
      return;
    }

    const { profile } = await getCurrentUser();
    const updateData: any = {
      client_id: appointment.clientId ?? null,
      service_id: appointment.serviceId,
      title: appointment.title ?? null,
      start_date_time: appointment.startDateTime,
      duration_min: appointment.durationMin,
      is_recurring: appointment.isRecurring,
      rrule: appointment.rrule ?? null,
      timezone: appointment.timezone ?? null,
      notes: appointment.notes ?? null,
      status: appointment.status ?? 'pending',

      // ⇩ conservar 0 correctamente
      payment_method: appointment.paymentMethod ?? null,
      final_price: appointment.finalPrice !== undefined ? Math.round(appointment.finalPrice * 100) : null,
      list_price:  appointment.listPrice  !== undefined ? Math.round(appointment.listPrice  * 100) : null,
      discount:    appointment.discount ?? null,
      payment_status: appointment.paymentStatus ?? 'pending',
      payment_notes: appointment.paymentNotes ?? null,

      actual_duration_min: appointment.actualDurationMin ?? null,
      started_at: appointment.startedAt ?? null,
      completed_at: appointment.completedAt ?? null,
      assigned_to: appointment.assignedTo ?? null,
    };

    const { error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointment.id)
      .eq('business_id', profile.business_id);

    if (error) throw error;
  },


  async update(id: string, changes: Partial<Appointment>): Promise<void> {
    const { profile } = await getCurrentUser();
    const updateData: any = {};

    if (changes.status !== undefined) updateData.status = changes.status;
    if (changes.title !== undefined) updateData.title = changes.title;
    if (changes.notes !== undefined) updateData.notes = changes.notes;

    // ⇩ conservar 0 correctamente
    if (changes.paymentMethod !== undefined) updateData.payment_method = changes.paymentMethod;
    if (changes.finalPrice  !== undefined)  updateData.final_price = Math.round(changes.finalPrice * 100);
    if (changes.listPrice   !== undefined)  updateData.list_price  = Math.round(changes.listPrice * 100);
    if (changes.discount    !== undefined)  updateData.discount    = changes.discount;
    if (changes.paymentStatus !== undefined) updateData.payment_status = changes.paymentStatus;
    if (changes.paymentNotes  !== undefined) updateData.payment_notes  = changes.paymentNotes;

    if (changes.actualDurationMin !== undefined) updateData.actual_duration_min = changes.actualDurationMin;
    if (changes.startedAt        !== undefined) updateData.started_at = changes.startedAt;
    if (changes.completedAt      !== undefined) updateData.completed_at = changes.completedAt;
    if (changes.assignedTo       !== undefined) updateData.assigned_to = changes.assignedTo;

    const { error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', profile.business_id);

    if (error) throw error;
  },


  async delete(id: string): Promise<void> {
    const { profile } = await getCurrentUser();
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
      .eq('business_id', profile.business_id);
    
    if (error) throw error;
  }
};

// 🆕 Walk-ins API
export const walkIns = {
  async toArray(): Promise<WalkIn[]> {
    const { profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('walk_ins')
      .select('*')
      .eq('business_id', profile.business_id)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data.map(toWalkIn);
  },

  async count(): Promise<number> {
    const { profile } = await getCurrentUser();
    const { count, error } = await supabase
      .from('walk_ins')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', profile.business_id);

    if (error) throw error;
    return count ?? 0;
  },

  async getByDate(date: string): Promise<WalkIn[]> {
    const { profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('walk_ins')
      .select('*')
      .eq('business_id', profile.business_id)
      .eq('date', date)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data.map(toWalkIn);
  },

  async add(walkIn: Omit<WalkIn, 'id'>): Promise<string> {
    const { profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('walk_ins')
      .insert([{
        business_id: profile.business_id,
        date: walkIn.date,
        client_id: walkIn.clientId || null,
        service_id: walkIn.serviceId || null,
        service_name: walkIn.serviceName || null,
        payment_method: walkIn.paymentMethod,
        final_price: Math.round(walkIn.finalPrice * 100),
        list_price: Math.round(walkIn.listPrice * 100),
        discount: walkIn.discount || 0,
        timestamp: walkIn.timestamp,
        notes: walkIn.notes || null,
        duration: walkIn.duration || 30,
      }])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async update(id: string, changes: Partial<WalkIn>): Promise<void> {
    const { profile } = await getCurrentUser();
    const updateData: any = {};
    
    if (changes.date !== undefined) updateData.date = changes.date;
    if (changes.clientId !== undefined) updateData.client_id = changes.clientId;
    if (changes.serviceId !== undefined) updateData.service_id = changes.serviceId;
    if (changes.serviceName !== undefined) updateData.service_name = changes.serviceName;
    if (changes.paymentMethod !== undefined) updateData.payment_method = changes.paymentMethod;
    if (changes.finalPrice !== undefined) updateData.final_price = Math.round(changes.finalPrice * 100);
    if (changes.listPrice !== undefined) updateData.list_price = Math.round(changes.listPrice * 100);
    if (changes.discount !== undefined) updateData.discount = changes.discount;
    if (changes.notes !== undefined) updateData.notes = changes.notes;
    if (changes.duration !== undefined) updateData.duration = changes.duration;
    
    // 🆕 Campos de tiempo y empleado
    if (changes.startedAt !== undefined) updateData.started_at = changes.startedAt;
    if (changes.completedAt !== undefined) updateData.completed_at = changes.completedAt;
    if (changes.servedBy !== undefined) updateData.served_by = changes.servedBy;

    const { error } = await supabase
      .from('walk_ins')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', profile.business_id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { profile } = await getCurrentUser();
    const { error } = await supabase
      .from('walk_ins')
      .delete()
      .eq('id', id)
      .eq('business_id', profile.business_id);
    
    if (error) throw error;
  },

  async clear(): Promise<void> {
    const { profile } = await getCurrentUser();
    const { error } = await supabase
      .from('walk_ins')
      .delete()
      .eq('business_id', profile.business_id);

    if (error) throw error;
  }
};

// APIs existentes sin cambios
export const exceptions = {
  async clear(): Promise<void> {
    const { profile } = await getCurrentUser();
    const { error } = await supabase
      .from('exceptions')
      .delete()
      .eq('business_id', profile.business_id);

    if (error) throw error;
  },

  async count(): Promise<number> {
    const { profile } = await getCurrentUser();
    const { count, error } = await supabase
      .from('exceptions')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', profile.business_id);

    if (error) throw error;
    return count ?? 0;
  },

  async toArray(): Promise<Exception[]> {
    const { profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('exceptions')
      .select('*')
      .eq('business_id', profile.business_id);
    
    if (error) throw error;
    return data.map(item => ({
      id: item.id,
      appointmentId: item.appointment_id,
      originalDateTime: item.original_date_time,
      type: item.type,
      newStartDateTime: item.new_start_date_time,
      newDurationMin: item.new_duration_min,
    }));
  },

  async add(exception: Omit<Exception, 'id'>): Promise<void> {
    const { profile } = await getCurrentUser();
    const { error } = await supabase
      .from('exceptions')
      .insert([{
        business_id: profile.business_id,
        appointment_id: exception.appointmentId,
        original_date_time: exception.originalDateTime,
        type: exception.type,
        new_start_date_time: exception.newStartDateTime || null,
        new_duration_min: exception.newDurationMin || null,
      }]);
    
    if (error) throw error;
  },

  async filter(predicate: (item: Exception) => boolean): Promise<Exception[]> {
    const all = await this.toArray();
    return all.filter(predicate);
  }
};

export const clientHistory = {
  async clear(): Promise<void> {
    const { profile } = await getCurrentUser();
    const { error } = await supabase
      .from('client_history')
      .delete()
      .eq('business_id', profile.business_id);

    if (error) throw error;
  },

  async add(history: Omit<ClientHistory, 'id'>): Promise<void> {
    const { profile } = await getCurrentUser();
    const { error } = await supabase
      .from('client_history')
      .insert([{
        business_id: profile.business_id,
        client_id: history.clientId,
        event_type: history.eventType,
        appointment_id: history.appointmentId || null,
        timestamp: history.timestamp,
        notes: history.notes || null,
      }]);
    
    if (error) throw error;
  },

  where(field: string) {
    return {
      equals: (value: string) => {
        // Extraer solo el UUID base si es appointmentId compuesto
        let cleanValue = value;
        if (field === 'appointmentId' && value.includes('::')) {
          cleanValue = value.split('::')[0];

        }

        return {
          reverse: () => ({
            sortBy: async (sortField: string): Promise<ClientHistory[]> => {
              const { profile } = await getCurrentUser();
              const { data, error } = await supabase
                .from('client_history')
                .select('*')
                .eq('business_id', profile.business_id)
                .eq(mapFieldName(field), cleanValue)  // usar cleanValue aquí
                .order('timestamp', { ascending: false });
              
              if (error) throw error;
              return data.map(item => ({
                id: item.id,
                clientId: item.client_id,
                eventType: item.event_type,
                appointmentId: item.appointment_id,
                timestamp: item.timestamp,
                notes: item.notes,
              }));
            }
          }),
          
          first: async (): Promise<ClientHistory | undefined> => {
            const { profile } = await getCurrentUser();
            const { data, error } = await supabase
              .from('client_history')
              .select('*')
              .eq('business_id', profile.business_id)
              .eq(mapFieldName(field), cleanValue)  // usar cleanValue aquí
              .limit(1)
              .maybeSingle();
            
            if (error && error.code !== 'PGRST116') throw error;
            return data ? {
              id: data.id,
              clientId: data.client_id,
              eventType: data.event_type,
              appointmentId: data.appointment_id,
              timestamp: data.timestamp,
              notes: data.notes,
            } : undefined;
          }
        };
      }
    };
  }
};

const mapFieldName = (field: string) => {
  switch (field) {
    case 'clientId': return 'client_id';
    case 'appointmentId': return 'appointment_id';
    case 'eventType': return 'event_type';
    default: return field;
  }
};

// 🆕 Funciones helper para estadísticas
export async function getDailyTraffic(date: string) {
  const { profile } = await getCurrentUser();
  
  // Citas del día completadas
  const { data: appointmentsData, error: appointmentsError } = await supabase
    .from('appointments')
    .select('*')
    .eq('business_id', profile.business_id)
    .gte('start_date_time', `${date}T00:00:00.000Z`)
    .lte('start_date_time', `${date}T23:59:59.999Z`)
    .eq('status', 'done');

  if (appointmentsError) throw appointmentsError;

  // Walk-ins del día
  const { data: walkInsData, error: walkInsError } = await supabase
    .from('walk_ins')
    .select('*')
    .eq('business_id', profile.business_id)
    .eq('date', date);

  if (walkInsError) throw walkInsError;

  const appointments = appointmentsData.map(toAppointment);
  const walkIns = walkInsData.map(toWalkIn);

  return {
    date,
    appointments: appointments.length,
    walkIns: walkIns.length,
    total: appointments.length + walkIns.length,
    appointmentData: appointments,
    walkInData: walkIns
  };
}

export async function getDailyRevenue(date: string) {
  const { profile } = await getCurrentUser();
  
  // Citas del día con pagos
  const { data: appointmentsData, error: appointmentsError } = await supabase
    .from('appointments')
    .select('*')
    .eq('business_id', profile.business_id)
    .gte('start_date_time', `${date}T00:00:00.000Z`)
    .lte('start_date_time', `${date}T23:59:59.999Z`)
    .eq('status', 'done');

  if (appointmentsError) throw appointmentsError;

  // Walk-ins del día
  const { data: walkInsData, error: walkInsError } = await supabase
    .from('walk_ins')
    .select('*')
    .eq('business_id', profile.business_id)
    .eq('date', date);

  if (walkInsError) throw walkInsError;

  const appointments = appointmentsData.map(toAppointment);
  const walkIns = walkInsData.map(toWalkIn);

  // Calcular totales
  let totalRevenue = 0;
  let cashRevenue = 0;
  let cardRevenue = 0;
  let transferRevenue = 0;
  let pendingRevenue = 0;

  // Revenue de citas
  appointments.forEach(apt => {
    const amount = apt.finalPrice || apt.listPrice || 0;
    
    // 🎯 Solo contar citas que NO estén canceladas
    if (apt.paymentStatus === 'paid') {
      totalRevenue += amount;
      
      switch (apt.paymentMethod) {
        case 'cash': cashRevenue += amount; break;
        case 'card': cardRevenue += amount; break;
        case 'transfer': transferRevenue += amount; break;
      }
    } else if (apt.paymentStatus === 'pending') {
      // Solo sumar a pending si NO está cancelado
      pendingRevenue += amount;
    }
    // 🎯 Las citas con paymentStatus = 'cancelled' NO se suman a ningún total
  });

  // Revenue de walk-ins (siempre considerados pagados)
  walkIns.forEach(walkIn => {
    totalRevenue += walkIn.finalPrice;
    
    switch (walkIn.paymentMethod) {
      case 'cash': cashRevenue += walkIn.finalPrice; break;
      case 'card': cardRevenue += walkIn.finalPrice; break;
      case 'transfer': transferRevenue += walkIn.finalPrice; break;
    }
  });

  return {
    date,
    totalRevenue,
    cashRevenue,
    cardRevenue,
    transferRevenue,
    pendingRevenue,
    totalServices: appointments.filter(a => a.paymentStatus !== 'cancelled').length + walkIns.length,
    paidServices: appointments.filter(a => a.paymentStatus === 'paid').length + walkIns.length,
    pendingServices: appointments.filter(a => a.paymentStatus === 'pending').length,
    cancelledServices: appointments.filter(a => a.paymentStatus === 'cancelled').length, // 🎯 Nuevo contador
    appointments,
    walkIns
  };
}

// 🆕 Convertidor para staff schedules
function toStaffSchedule(data: any): StaffSchedule {
  return {
    id: data.id,
    businessId: data.business_id,
    userId: data.user_id,
    dayOfWeek: data.day_of_week,
    startTime: data.start_time,
    endTime: data.end_time,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// 🆕 Convertidor para user profiles
function toUserProfile(data: any): UserProfile {
  return {
    id: data.id,
    businessId: data.business_id,
    role: data.role,
    name: data.name,
    createdAt: data.created_at,
  };
}

export const userProfiles = {
  async toArray(): Promise<UserProfile[]> {
    const { profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('business_id', profile.business_id)
      .order('name');
    
    if (error) throw error;
    return data.map(toUserProfile);
  },

  async get(id: string): Promise<UserProfile | undefined> {
    const { profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .eq('business_id', profile.business_id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toUserProfile(data) : undefined;
  }
};

export const staffSchedules = {
  async toArray(): Promise<StaffSchedule[]> {
    const { profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('staff_schedules')
      .select('*')
      .eq('business_id', profile.business_id)
      .eq('is_active', true)
      .order('user_id')
      .order('day_of_week');
    
    if (error) throw error;
    return data.map(toStaffSchedule);
  },

  async getByUser(userId: string): Promise<StaffSchedule[]> {
    const { profile } = await getCurrentUser();
    const { data, error } = await supabase
      .from('staff_schedules')
      .select('*')
      .eq('business_id', profile.business_id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('day_of_week');
    
    if (error) throw error;
    return data.map(toStaffSchedule);
  },

  async add(schedule: Omit<StaffSchedule, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const { profile } = await getCurrentUser();
    const row: any = {
      business_id: profile.business_id,
      user_id: schedule.userId,
      day_of_week: schedule.dayOfWeek,
      start_time: schedule.startTime,
      end_time: schedule.endTime,
    };
    if (schedule.isActive !== undefined) row.is_active = schedule.isActive;

    const { data, error } = await supabase
      .from('staff_schedules')
      .insert([row])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },


  async update(id: string, changes: Partial<StaffSchedule>): Promise<void> {
    const { profile } = await getCurrentUser();
    const updateData: any = {};
    
    if (changes.dayOfWeek !== undefined) updateData.day_of_week = changes.dayOfWeek;
    if (changes.startTime !== undefined) updateData.start_time = changes.startTime;
    if (changes.endTime !== undefined) updateData.end_time = changes.endTime;
    if (changes.isActive !== undefined) updateData.is_active = changes.isActive;

    const { error } = await supabase
      .from('staff_schedules')
      .update(updateData)
      .eq('id', id)
      .eq('business_id', profile.business_id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { profile } = await getCurrentUser();
    const { error } = await supabase
      .from('staff_schedules')
      .delete()
      .eq('id', id)
      .eq('business_id', profile.business_id);
    
    if (error) throw error;
  }
};

export function calculateActualDuration(startedAt?: string, completedAt?: string): number | undefined {
  if (!startedAt || !completedAt) return undefined;
  
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const durationMs = end - start;
  
  return Math.round(durationMs / (1000 * 60)); // convertir a minutos
}

// 🆕 Helper para obtener empleados disponibles en un horario
export async function getAvailableStaff(dayOfWeek: number, time: string): Promise<UserProfile[]> {
  const { profile } = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('staff_schedules')
    .select(`
      user_id,
      user_profiles!inner (
        id,
        business_id,
        role,
        name,
        created_at
      )
    `)
    .eq('business_id', profile.business_id)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .lte('start_time', time)
    .gte('end_time', time);

  if (error) throw error;
  
  return data.map(item => toUserProfile(item.user_profiles));
}




// Export simplificado
export const db = {
  clients,
  services,
  appointments, // ya actualizado con los nuevos campos
  exceptions,
  clientHistory,
  walkIns, // ya actualizado con los nuevos campos
  userProfiles, // 🆕
  staffSchedules, // 🆕
};