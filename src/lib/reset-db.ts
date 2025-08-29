import { db } from './supabase-db';

export async function resetSupabaseTenant() {
  console.log('🗑️ Reseteando datos del tenant...');
  
  try {
    // Limpiar en orden inverso para evitar problemas de referencias
    await db.clientHistory.clear();
    await db.exceptions.clear();
    await db.appointments.clear();
    await db.services.clear();
    await db.clients.clear();
    
    console.log('✅ Todos los datos del tenant eliminados');
  } catch (error) {
    console.error('❌ Error al resetear:', error);
    throw error;
  }
}