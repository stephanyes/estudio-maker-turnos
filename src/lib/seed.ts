import { db, Client, Service, Appointment, Exception } from './supabase-db';
import { DateTime } from 'luxon';

type IdMap = Record<string, string>;

// Add seed data without clearing existing data (safer for testing)
export async function addSeedData() {
  // console.log('🌱 Agregando datos de prueba (sin limpiar existentes)...');
  try {
    const serviceIds = await seedServices();
    const clientIds = await seedClients();
    const appointmentIds = await seedAppointments(serviceIds, clientIds);
    await seedExceptions(appointmentIds);
    await seedWalkIns(serviceIds, clientIds);
    await seedClientHistory();

    // console.log('✅ Datos de prueba agregados exitosamente');
  } catch (error) {
    console.error('❌ Error al agregar datos:', error);
    throw error;
  }
}

export async function seedDatabase() {
  console.log('🌱 Sembrando datos de prueba...');
  try {
    console.log('🧹 Limpiando datos existentes...');
    await db.exceptions.clear();
    await db.appointments.clear();
    await db.services.clear();
    await db.clients.clear();
    await db.clientHistory.clear();
    await db.walkIns.clear();

    const serviceIds = await seedServices();
    const clientIds = await seedClients();
    const appointmentIds = await seedAppointments(serviceIds, clientIds);
    await seedExceptions(appointmentIds);
    await seedWalkIns(serviceIds, clientIds);
    await seedClientHistory();

    console.log('✅ Datos de prueba sembrados exitosamente');
  } catch (error) {
    console.error('❌ Error al sembrar:', error);
    throw error;
  }
}

async function seedServices(): Promise<IdMap> {
  const services: (Omit<Service, 'id'> & { key: string })[] = [
    { key: 'service-1', name: 'Corte Básico', price: 8000 },
    { key: 'service-2', name: 'Corte + Barba', price: 12000 },
    { key: 'service-3', name: 'Corte Premium', price: 15000 },
    { key: 'service-4', name: 'Solo Barba', price: 6000 },
    { key: 'service-5', name: 'Corte + Barba + Cejas', price: 18000 },
    { key: 'service-6', name: 'Lavado + Corte', price: 10000 },
  ];

  const ids: IdMap = {};
  for (const s of services) {
    const id = await db.services.add({ name: s.name, price: s.price });
    ids[s.key] = id;
  }
  console.log(`📋 ${services.length} servicios agregados`);
  return ids;
}

async function seedClients(): Promise<IdMap> {
  const now = DateTime.now();
  const clients: (Omit<Client, 'id'> & { key: string })[] = [
    { key: 'client-1', name: 'Juan Pérez', phone: '+54911234567', totalVisits: 0, totalCancellations: 0, contactMethod: 'whatsapp', contactHandle: '+54911234567', createdAt: now.minus({ months: 6 }).toISO()!, notes: 'Cliente regular, prefiere cortes clásicos' },
    { key: 'client-2', name: 'Carlos González', phone: '+54911234568', totalVisits: 0, totalCancellations: 0, contactMethod: 'instagram', contactHandle: '@carlosg_ok', createdAt: now.minus({ months: 4 }).toISO()! },
    { key: 'client-3', name: 'Miguel Rodriguez', phone: '+54911234569', totalVisits: 0, totalCancellations: 0, contactMethod: 'whatsapp', contactHandle: '+54911234569', createdAt: now.minus({ months: 5 }).toISO()!, notes: 'Suele llegar 10 min tarde' },
    { key: 'client-4', name: 'Roberto Silva', phone: '+54911234570', totalVisits: 0, totalCancellations: 0, contactMethod: 'phone', contactHandle: '+54911234570', createdAt: now.minus({ months: 3 }).toISO()! },
    { key: 'client-5', name: 'Fernando López', phone: '+54911234571', totalVisits: 0, totalCancellations: 0, contactMethod: 'instagram', contactHandle: '@ferlopez22', createdAt: now.minus({ months: 2 }).toISO()!, notes: 'Primera vez, explicar bien los servicios' },
    { key: 'client-6', name: 'Diego Martín', phone: '+54911234572', totalVisits: 0, totalCancellations: 0, contactMethod: 'whatsapp', contactHandle: '+54911234572', createdAt: now.minus({ months: 7 }).toISO()! },
    { key: 'client-7', name: 'Alejandro Torres', phone: '+54911234573', totalVisits: 0, totalCancellations: 0, contactMethod: 'instagram', contactHandle: '@ale_torres', createdAt: now.minus({ months: 1 }).toISO()!, notes: 'Cliente VIP, siempre puntual' },
    { key: 'client-8', name: 'Pablo Morales', phone: '+54911234574', totalVisits: 0, totalCancellations: 0, contactMethod: 'whatsapp', contactHandle: '+54911234574', createdAt: now.minus({ weeks: 3 }).toISO()! },
    { key: 'client-9', name: 'Andrés Castro', phone: '+54911234575', totalVisits: 0, totalCancellations: 0, contactMethod: 'instagram', contactHandle: '@andres_castro', createdAt: now.minus({ weeks: 2 }).toISO()!, notes: 'Le gusta charlar de fútbol' },
    { key: 'client-10', name: 'Lucas Herrera', phone: '+54911234576', totalVisits: 0, totalCancellations: 0, contactMethod: 'whatsapp', contactHandle: '+54911234576', createdAt: now.minus({ weeks: 1 }).toISO()! },
  ];

  const ids: IdMap = {};
  for (const c of clients) {
    const id = await db.clients.add({
      name: c.name,
      phone: c.phone,
      totalVisits: c.totalVisits,
      totalCancellations: c.totalCancellations,
      contactMethod: c.contactMethod,
      contactHandle: c.contactHandle,
      createdAt: c.createdAt,
      notes: c.notes
    });
    ids[c.key] = id;
  }
  console.log(`👥 ${clients.length} clientes agregados`);
  return ids;
}

// Helper para generar variación realista en el timing
function generateRealisticTiming(estimatedMin: number) {
  // Variación del -10% a +25% del tiempo estimado
  const variance = (Math.random() - 0.4) * 0.35; // -0.4 to -0.05, rango [-10%, +25%]
  const actualMin = Math.max(5, Math.round(estimatedMin * (1 + variance)));
  
  // Simular inicio retrasado (0-15 minutos)
  const startDelay = Math.floor(Math.random() * 16);
  
  return {
    actualDurationMin: actualMin,
    startDelayMin: startDelay
  };
}

async function seedAppointments(serviceIds: IdMap, clientIds: IdMap): Promise<IdMap> {
  const now = DateTime.now().setZone('America/Argentina/Buenos_Aires');
  const keysToIds: IdMap = {};

  const sid = (key: string) => serviceIds[key];
  const cid = (key: string) => clientIds[key];

  const addApp = async (
    a: Omit<Appointment, 'id' | 'serviceId' | 'clientId'> & { 
      serviceKey: string; 
      clientKey?: string;
      key?: string;
      withTiming?: boolean;
    }
  ) => {
    try {
      let appointmentData: Omit<Appointment, 'id'> = {
        serviceId: sid(a.serviceKey),
        clientId: a.clientKey ? cid(a.clientKey) : undefined,
        title: a.title,
        startDateTime: a.startDateTime,
        durationMin: a.durationMin,
        isRecurring: a.isRecurring,
        rrule: a.rrule,
        timezone: a.timezone,
        notes: a.notes,
        status: a.status,
        paymentMethod: a.paymentMethod,
        finalPrice: a.finalPrice,
        listPrice: a.listPrice,
        discount: a.discount,
        paymentStatus: a.paymentStatus,
        paymentNotes: a.paymentNotes,
      };

      // Agregar timing realista para citas completadas
      if (a.withTiming && a.status === 'done') {
        const timing = generateRealisticTiming(a.durationMin);
        const scheduledStart = DateTime.fromISO(a.startDateTime);
        const actualStart = scheduledStart.plus({ minutes: timing.startDelayMin });
        const actualEnd = actualStart.plus({ minutes: timing.actualDurationMin });

        appointmentData = {
          ...appointmentData,
          startedAt: actualStart.toISO() || undefined,
          completedAt: actualEnd.toISO() || undefined,
          actualDurationMin: timing.actualDurationMin,
        };
      }

      const insertedId = await db.appointments.add(appointmentData);
      if (a.key) keysToIds[a.key] = insertedId;
      console.log('➕ cita OK:', a.title ?? a.startDateTime);
    } catch (e) {
      console.error('❌ fallo insert cita:', { a }, e);
      throw e;
    }
  };

  // Agosto - Citas completadas con timing realista
  const augustDates = [
    { day: 1, hour: 9, min: 0 }, { day: 1, hour: 11, min: 30 }, { day: 1, hour: 16, min: 0 },
    { day: 2, hour: 10, min: 0 }, { day: 2, hour: 14, min: 30 },
    { day: 5, hour: 9, min: 30 }, { day: 5, hour: 15, min: 0 }, { day: 5, hour: 17, min: 30 },
    { day: 6, hour: 11, min: 0 }, { day: 6, hour: 16, min: 30 },
    { day: 8, hour: 10, min: 30 }, { day: 8, hour: 13, min: 0 }, { day: 8, hour: 18, min: 0 },
    { day: 9, hour: 9, min: 0 }, { day: 9, hour: 15, min: 30 },
    { day: 12, hour: 10, min: 0 }, { day: 12, hour: 14, min: 0 }, { day: 12, hour: 19, min: 0 },
    { day: 13, hour: 11, min: 30 }, { day: 13, hour: 16, min: 0 },
    { day: 15, hour: 9, min: 30 }, { day: 15, hour: 12, min: 0 }, { day: 15, hour: 17, min: 0 },
    { day: 16, hour: 10, min: 0 }, { day: 16, hour: 15, min: 30 },
    { day: 19, hour: 9, min: 0 }, { day: 19, hour: 13, min: 30 }, { day: 19, hour: 18, min: 30 },
    { day: 20, hour: 11, min: 0 }, { day: 20, hour: 16, min: 30 },
    { day: 22, hour: 10, min: 30 }, { day: 22, hour: 14, min: 30 }, { day: 22, hour: 19, min: 30 },
    { day: 23, hour: 9, min: 30 }, { day: 23, hour: 15, min: 0 },
    { day: 26, hour: 10, min: 0 }, { day: 26, hour: 17, min: 0 },
  ];

  const services = ['service-1', 'service-2', 'service-3', 'service-4', 'service-5', 'service-6'];
  const clients = ['client-1', 'client-2', 'client-3', 'client-4', 'client-5', 'client-6', 'client-7', 'client-8', 'client-9', 'client-10'];
  const durations = { 'service-1': 30, 'service-2': 45, 'service-3': 60, 'service-4': 30, 'service-5': 75, 'service-6': 45 };
  const prices = { 'service-1': 8000, 'service-2': 12000, 'service-3': 15000, 'service-4': 6000, 'service-5': 18000, 'service-6': 10000 };

  // Generar citas de agosto con timing
  for (const [index, date] of augustDates.entries()) {
    const serviceKey = services[Math.floor(Math.random() * services.length)];
    const clientKey = Math.random() > 0.3 ? clients[Math.floor(Math.random() * clients.length)] : undefined; // 70% tienen cliente
    const duration = durations[serviceKey as keyof typeof durations];
    const price = prices[serviceKey as keyof typeof prices];
    
    const startTime = now.set({ month: 8, day: date.day, hour: date.hour, minute: date.min });
    const shouldHavePayment = Math.random() > 0.4; // 60% tienen pago
    const paymentMethods = ['cash', 'card', 'transfer'] as const;
    const paymentMethod = shouldHavePayment ? paymentMethods[Math.floor(Math.random() * 3)] : undefined;
    
    let finalPrice, discount;
    if (shouldHavePayment) {
      discount = paymentMethod === 'cash' ? 10 : 0;
      finalPrice = Math.round(price * (1 - discount / 100));
    }

    await addApp({
      key: `august-${index + 1}`,
      serviceKey,
      clientKey,
      title: clientKey ? `${services[Math.floor(Math.random() * services.length)].replace('service-', '')} - Cliente` : undefined,
      startDateTime: startTime.toISO()!,
      durationMin: duration,
      isRecurring: false,
      status: 'done',
      withTiming: true, // Generar timing realista
      paymentMethod,
      finalPrice,
      listPrice: price,
      discount,
      paymentStatus: shouldHavePayment ? (Math.random() > 0.2 ? 'paid' : 'pending') : 'pending',
    });
  }

  // Citas de hoy - algunas en progreso, otras listas para iniciar
  const today = now.startOf('day');
  
  await addApp({ 
    key: 'today-1', 
    serviceKey: 'service-3', 
    clientKey: 'client-7',
    title: 'Corte Premium - Alejandro Torres', 
    startDateTime: today.set({ hour: 9, minute: 0 }).toISO()!, 
    durationMin: 60, 
    isRecurring: false, 
    status: 'done',
    withTiming: true,
    paymentMethod: 'cash',
    finalPrice: 13500,
    listPrice: 15000,
    discount: 10,
    paymentStatus: 'paid'
  });

  await addApp({ 
    key: 'today-2', 
    serviceKey: 'service-2', 
    clientKey: 'client-6',
    title: 'Mantenimiento quincenal - Diego', 
    startDateTime: today.set({ hour: 15, minute: 0 }).toISO()!, 
    durationMin: 45, 
    isRecurring: false, 
    status: 'done' // Sin timing para que aparezca en ActiveServices
  });

  await addApp({ 
    key: 'today-3', 
    serviceKey: 'service-1', 
    startDateTime: today.set({ hour: 17, minute: 30 }).toISO()!, 
    durationMin: 30, 
    isRecurring: false, 
    status: 'done' // Sin timing para que aparezca en ActiveServices
  });

  await addApp({ 
    key: 'today-4', 
    serviceKey: 'service-4', 
    title: 'Solo barba - sin cita', 
    startDateTime: today.set({ hour: 19, minute: 0 }).toISO()!, 
    durationMin: 30, 
    isRecurring: false, 
    status: 'done' // Sin timing para que aparezca en ActiveServices
  });

  // Futuras
  await addApp({ 
    key: 'future-1', 
    serviceKey: 'service-5', 
    clientKey: 'client-9',
    title: 'Corte + Barba + Cejas - Andrés Castro',
    startDateTime: now.plus({ days: 1 }).set({ hour: 20, minute: 15 }).toISO()!, 
    durationMin: 75, 
    isRecurring: false, 
    status: 'pending',
    paymentMethod: 'cash',
    finalPrice: 16200,
    listPrice: 18000,
    discount: 10,
    paymentStatus: 'pending'
  });

  await addApp({ 
    key: 'future-2', 
    serviceKey: 'service-6', 
    clientKey: 'client-7',
    title: 'Lavado + Corte - Alejandro Torres',
    startDateTime: now.plus({ hours: 2 }).toISO()!, 
    durationMin: 30, 
    isRecurring: false, 
    status: 'pending',
    paymentMethod: 'cash',
    finalPrice: 9000,
    listPrice: 10000,
    discount: 10,
    paymentStatus: 'paid'
  });

  // Recurrentes
  await addApp({
    key: 'recurring-1',
    serviceKey: 'service-1',
    clientKey: 'client-8',
    title: 'Corte semanal - Pablo',
    startDateTime: now.minus({ days: 1 }).set({ hour: 12, minute: 0 }).toISO()!,
    durationMin: 30,
    isRecurring: true,
    rrule: { freq: 'WEEKLY', interval: 1, byweekday: [(now.weekday - 2 + 7) % 7], until: now.plus({ months: 3 }).toISO()! },
    status: 'pending',
  });

  await addApp({
    key: 'recurring-2',
    serviceKey: 'service-3',
    clientKey: 'client-9',
    title: 'Sesión VIP mensual - Andrés',
    startDateTime: now.plus({ days: 5 }).set({ hour: 17, minute: 0 }).toISO()!,
    durationMin: 60,
    isRecurring: true,
    rrule: { freq: 'MONTHLY', interval: 1, count: 6 },
    status: 'pending',
    notes: 'Cliente VIP, siempre puntual, le gusta charlar de fútbol',
  });

  // Cancelada
  await addApp({
    key: 'cancelled-1',
    serviceKey: 'service-6',
    startDateTime: now.plus({ hours: 3 }).toISO()!,
    durationMin: 45,
    isRecurring: false,
    status: 'cancelled',
    notes: 'Cliente canceló por emergencia familiar',
  });

  console.log('📅 citas cargadas con timing realista');
  return keysToIds;
}

async function seedWalkIns(serviceIds: IdMap, clientIds: IdMap): Promise<void> {
  const now = DateTime.now().setZone('America/Argentina/Buenos_Aires');
  
  const walkIns = [
    {
      date: now.minus({ days: 1 }).toISODate()!,
      serviceId: serviceIds['service-1'],
      serviceName: 'Corte Básico',
      clientId: clientIds['client-3'],
      paymentMethod: 'cash' as const,
      finalPrice: 7200,
      listPrice: 8000,
      discount: 10,
      timestamp: now.minus({ days: 1 }).set({ hour: 14, minute: 30 }).toISO()!,
      notes: 'Walk-in sin cita previa',
      duration: 30,
      // Agregar timing completado
      startedAt: now.minus({ days: 1 }).set({ hour: 14, minute: 35 }).toISO()!,
      completedAt: now.minus({ days: 1 }).set({ hour: 15, minute: 8 }).toISO()!, // 33 minutos reales
    },
    {
      date: now.toISODate()!,
      serviceId: serviceIds['service-4'],
      serviceName: 'Solo Barba',
      paymentMethod: 'card' as const,
      finalPrice: 6000,
      listPrice: 6000,
      discount: 0,
      timestamp: now.set({ hour: 13, minute: 0 }).toISO()!,
      notes: 'Cliente nuevo, walk-in',
      duration: 25,
      // Sin timing para que aparezca en ActiveServices
    }
  ];

  for (const wi of walkIns) {
    await db.walkIns.add(wi);
  }
  
  console.log(`🚶‍♂️ ${walkIns.length} walk-ins agregados`);
}

async function seedExceptions(appointmentIds: IdMap) {
  const now = DateTime.now().setZone('America/Argentina/Buenos_Aires');

  const moveDate = now.plus({ weeks: 2 }).set({ hour: 15, minute: 0 });
  await db.exceptions.add({
    appointmentId: appointmentIds['recurring-1'],
    originalDateTime: moveDate.toISO()!,
    type: 'move',
    newStartDateTime: moveDate.set({ hour: 16, minute: 30 }).toISO()!,
    newDurationMin: 60,
  });

  const skipDate = now.plus({ weeks: 1 }).minus({ days: 1 }).set({ hour: 12, minute: 0 });
  await db.exceptions.add({
    appointmentId: appointmentIds['recurring-1'],
    originalDateTime: skipDate.toISO()!,
    type: 'skip',
  });

  console.log('⚠️ excepciones agregadas');
}

async function seedClientHistory(): Promise<void> {
  const [clients, appointments] = await Promise.all([
    db.clients.toArray(),
    db.appointments.toArray(),
  ]);

  let created = 0;

  for (const c of clients) {
    await db.clientHistory.add({
      clientId: c.id!,
      eventType: 'client_created',
      timestamp: c.createdAt,
      notes: 'Cliente registrado en el sistema',
    });
    created++;
  }

  for (const a of appointments) {
    if (!a.clientId) continue;

    if (a.status === 'done') {
      await db.clientHistory.add({
        clientId: a.clientId,
        eventType: 'visit_completed',
        appointmentId: a.id!,
        timestamp: a.completedAt || a.startDateTime,
        notes: 'Servicio completado satisfactoriamente',
      });
      created++;
    }

    if (a.status === 'cancelled') {
      await db.clientHistory.add({
        clientId: a.clientId,
        eventType: 'appointment_cancelled',
        appointmentId: a.id!,
        timestamp: a.startDateTime,
        notes: 'Cita cancelada',
      });
      created++;
    }
  }

  console.log(`🧾 ${created} eventos agregados a client_history`);
}

export async function verifySeedData() {
  const [clients, services, appointments, exceptions, walkIns] = await Promise.all([
    db.clients.count(),
    db.services.count(),
    db.appointments.count(),
    db.exceptions.count(),
    db.walkIns.count(),
  ]);

  console.log('📊 Resumen de datos:');
  console.log(`   Clientes: ${clients}`);
  console.log(`   Servicios: ${services}`);
  console.log(`   Citas: ${appointments}`);
  console.log(`   Excepciones: ${exceptions}`);
  console.log(`   Walk-ins: ${walkIns}`);

  return { clients, services, appointments, exceptions, walkIns };
}

export async function getQuickStats() {
  const now = DateTime.now();
  const today = now.startOf('day');
  const tomorrow = today.plus({ days: 1 });

  const [allAppointments, todayApps] = await Promise.all([
    db.appointments.toArray(),
    db.appointments.where('startDateTime').between(today.toISO()!, tomorrow.toISO()!).toArray(),
  ]);

  const completedWithTiming = allAppointments.filter(a => 
    a.status === 'done' && a.startedAt && a.completedAt
  ).length;

  const activeServices = allAppointments.filter(a => 
    a.status === 'done' && !a.completedAt
  ).length;

  const stats = {
    totalAppointments: allAppointments.length,
    recurringAppointments: allAppointments.filter(a => a.isRecurring).length,
    completedWithTiming,
    activeServices,
    todayAppointments: todayApps.length,
    pendingToday: todayApps.filter(a => a.status === 'pending').length,
    doneToday: todayApps.filter(a => a.status === 'done').length,
  };

  console.log('📈 Estadísticas rápidas:', stats);
  return stats;
}