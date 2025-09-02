/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from './supabase-db';

export async function exportJSON() {
  const [clients, services, appointments, exceptions] = await Promise.all([
    db.clients.toArray(),
    db.services.toArray(),
    db.appointments.toArray(),
    db.exceptions.toArray(),
  ]);
  
  return { 
    version: 2, // incrementar versión para Supabase
    timestamp: new Date().toISOString(),
    clients, 
    services,
    appointments, 
    exceptions 
    // clientHistory: [] // agregar cuando esté disponible
  };
}

export async function importJSON(data: any) {
  if (!data || !data.version) throw new Error('Archivo inválido');
  
      // console.log('Importando datos:', data);

  try {
    // No hay transacciones, hacer operaciones individuales
    // Importar en orden: services -> clients -> appointments -> exceptions
    
    // 1. Servicios
    if (data.services?.length) {
      // console.log(`Importando ${data.services.length} servicios...`);
      for (const service of data.services) {
        try {
          if (service.id && service.name && service.price !== undefined) {
            await db.services.put(service);
          }
        } catch (error) {
          console.warn('Error importando servicio:', service, error);
        }
      }
    }

    // 2. Clientes - usar add() porque no hay put()
    if (data.clients?.length) {
      // console.log(`Importando ${data.clients.length} clientes...`);
      for (const client of data.clients) {
        try {
          if (client.name) {
            // Omitir ID y crear nuevo
            const { id, ...clientData } = client;
            await db.clients.add(clientData);
          }
        } catch (error) {
          console.warn('Error importando cliente:', client, error);
        }
      }
    }

    // 3. Citas
    if (data.appointments?.length) {
      // console.log(`Importando ${data.appointments.length} citas...`);
      for (const appointment of data.appointments) {
        try {
          if (appointment.id && appointment.serviceId && appointment.startDateTime) {
            await db.appointments.put(appointment);
          }
        } catch (error) {
          console.warn('Error importando cita:', appointment, error);
        }
      }
    }

    // 4. Excepciones
    if (data.exceptions?.length) {
      // console.log(`Importando ${data.exceptions.length} excepciones...`);
      for (const exception of data.exceptions) {
        try {
          if (exception.appointmentId && exception.originalDateTime && exception.type) {
            // Omitir ID y crear nuevo
            const { id, ...exceptionData } = exception;
            await db.exceptions.add(exceptionData);
          }
        } catch (error) {
          console.warn('Error importando excepción:', exception, error);
        }
      }
    }

    // console.log('Importación completada');
  } catch (error) {
    console.error('Error durante importación:', error);
    throw new Error(`Error al importar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}