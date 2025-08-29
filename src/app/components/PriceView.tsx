'use client';
import { useState } from 'react';
import { useCreateService, useUpdateService, useDeleteService } from '@/lib/queries';
import { useData } from '@/app/context/DataProvider';
import { useAuth } from '@/app/context/AuthContext';

type Service = { id: string; name: string; price: number; createdBy?: string };

export default function PricesView() {
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState<number | ''>('');

  // 🎯 DataProvider para obtener todos los datos
  const { services, loading, hasErrors, errors, retry, canRetry } = useData();
  const { user, userProfile } = useAuth();
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();

  // Separar servicios por creador
  const adminServices = services.filter((s: Service) => s.createdBy !== user?.id);
  const myServices = services.filter((s: Service) => s.createdBy === user?.id);

  const handleAddService = async () => {
    if (!newName || !newPrice) return;
    
    try {
      await createServiceMutation.mutateAsync({
        // id: crypto.randomUUID(),
        name: newName,
        price: Number(newPrice),
      });
      setNewName('');
      setNewPrice('');
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const handleUpdatePrice = async (id: string, price: number) => {
    if (price < 0) return; // validación básica
    
    try {
      await updateServiceMutation.mutateAsync({
        id,
        changes: { price }
      });
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  const handleRemoveService = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;
    
    try {
      await deleteServiceMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error removing service:', error);
    }
  };

  // Loading state
  if (loading.core) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="animate-spin w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full flex-shrink-0"></div>
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">Cargando servicios...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (hasErrors) {
    return (
      <div className="card p-4 space-y-4">
        <h2 className="text-lg font-bold">💲 Precios de servicios</h2>
        <div className="text-center py-8 text-red-500">
          <p>Error al cargar los servicios</p>
          <p className="text-sm text-zinc-600 mb-2">
            {Object.values(errors).find(error => error)?.message || 'Error desconocido'}
          </p>
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="text-sm underline hover:no-underline"
            >
              Recargar página
            </button>
            {canRetry && (
              <button 
                onClick={retry}
                className="text-sm underline hover:no-underline"
              >
                Reintentar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isAnyMutationLoading = 
    createServiceMutation.isPending || 
    updateServiceMutation.isPending || 
    deleteServiceMutation.isPending;

  return (
    <div className="card p-4 space-y-4">
      <h2 className="text-lg font-bold">💲 Precios de servicios</h2>

      {/* Mis servicios (creados por el usuario actual) */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700 pb-2">
          👤 Mis servicios ({myServices.length})
        </h3>
        <div className="space-y-2">
          {myServices.map((s) => (
            <div key={s.id} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="flex-1">{s.name}</span>
              <input
                type="number"
                value={s.price}
                onChange={(e) => {
                  const newPrice = Number(e.target.value);
                  if (!isNaN(newPrice)) {
                    handleUpdatePrice(s.id, newPrice);
                  }
                }}
                className="border rounded px-2 py-1 w-28 text-right dark:bg-neutral-900 dark:border-zinc-700"
                disabled={updateServiceMutation.isPending}
                min="0"
                step="0.01"
              />
              <button
                onClick={() => handleRemoveService(s.id)}
                className="px-2 py-1 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deleteServiceMutation.isPending}
                title="Eliminar servicio"
              >
                ✕
              </button>
            </div>
          ))}
          {myServices.length === 0 && (
            <p className="text-sm text-zinc-500 italic">No has creado servicios aún</p>
          )}
        </div>
      </div>

      {/* Servicios del admin (solo si no eres admin) */}
      {userProfile?.role !== 'admin' && adminServices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700 pb-2">
            👑 Servicios del administrador ({adminServices.length})
          </h3>
          <div className="space-y-2">
            {adminServices.map((s) => (
              <div key={s.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="flex-1">{s.name}</span>
                <input
                  type="number"
                  value={s.price}
                  onChange={(e) => {
                    const newPrice = Number(e.target.value);
                    if (!isNaN(newPrice)) {
                      handleUpdatePrice(s.id, newPrice);
                    }
                  }}
                  className="border rounded px-2 py-1 w-28 text-right dark:bg-neutral-900 dark:border-zinc-700"
                  disabled={updateServiceMutation.isPending}
                  min="0"
                  step="0.01"
                />
                <span className="text-xs text-gray-500 px-2">Solo lectura</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Si eres admin, mostrar todos los servicios juntos */}
      {userProfile?.role === 'admin' && adminServices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700 pb-2">
            👑 Servicios del sistema ({adminServices.length})
          </h3>
          <div className="space-y-2">
            {adminServices.map((s) => (
              <div key={s.id} className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <span className="flex-1">{s.name}</span>
                <input
                  type="number"
                  value={s.price}
                  onChange={(e) => {
                    const newPrice = Number(e.target.value);
                    if (!isNaN(newPrice)) {
                      handleUpdatePrice(s.id, newPrice);
                    }
                  }}
                  className="border rounded px-2 py-1 w-28 text-right dark:bg-neutral-900 dark:border-zinc-700"
                  disabled={updateServiceMutation.isPending}
                  min="0"
                  step="0.01"
                />
                <button
                  onClick={() => handleRemoveService(s.id)}
                  className="px-2 py-1 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deleteServiceMutation.isPending}
                  title="Eliminar servicio"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* agregar nuevo servicio */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700 pb-2">
          ➕ Agregar nuevo servicio
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Nombre del servicio (ej: Corte, Color, etc.)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 border rounded px-2 py-1 dark:bg-neutral-900 dark:border-zinc-700"
            disabled={isAnyMutationLoading}
            maxLength={50}
          />
          <input
            type="number"
            placeholder="Precio ($)"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-32 border rounded px-2 py-1 dark:bg-neutral-900 dark:border-zinc-700"
            disabled={isAnyMutationLoading}
            min="0"
            step="0.01"
          />
          <button
            onClick={handleAddService}
            className="px-3 py-1 rounded bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={!newName || !newPrice || isAnyMutationLoading}
          >
            {createServiceMutation.isPending ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Agregando...
              </>
            ) : (
              'Agregar servicio'
            )}
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          💡 Los servicios que agregues aparecerán en "Mis servicios" y podrás editarlos libremente.
        </p>
      </div>

      {/* Mensajes de estado de las mutaciones */}
      {createServiceMutation.error && (
        <div className="text-red-500 text-sm">
          Error al crear servicio: {createServiceMutation.error.message}
        </div>
      )}
      {updateServiceMutation.error && (
        <div className="text-red-500 text-sm">
          Error al actualizar precio: {updateServiceMutation.error.message}
        </div>
      )}
      {deleteServiceMutation.error && (
        <div className="text-red-500 text-sm">
          Error al eliminar servicio: {deleteServiceMutation.error.message}
        </div>
      )}
    </div>
  );
}