import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db, Client } from '@/lib/supabase-db';
import { useLatestClientNote } from '@/lib/queries';

import { Search, Plus, User } from 'lucide-react';

// Componente para mostrar la última nota de un cliente
function ClientLatestNote({ clientId }: { clientId: string }) {
  const { data: latestNote, isLoading } = useLatestClientNote(clientId);

  if (isLoading) {
    return <div className="text-xs text-sky-400">Cargando...</div>;
  }

  if (!latestNote) {
    return null;
  }

  return (
    <div className="mt-2 text-sm text-sky-800 dark:text-sky-200 italic">
      "{latestNote.noteText}"
    </div>
  );
}

type Props = {
  selectedClientId?: string;
  onClientSelected: (clientId: string | undefined) => void;
  onClientCreated?: (client: Client) => void;
};

export default function ClientSelector({ selectedClientId, onClientSelected, onClientCreated }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.client-selector-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  // Cargar todos los clientes al montar
  useEffect(() => {
    loadClients();
  }, []);

  // Buscar cliente seleccionado cuando cambia selectedClientId
  useEffect(() => {
    if (selectedClientId) {
      db.clients.get(selectedClientId).then(client => {
        setSelectedClient(client || null);
      });
    } else {
      setSelectedClient(null);
    }
  }, [selectedClientId]);

  const loadClients = async () => {
    const allClients = await db.clients.orderBy('name');
    setClients(allClients);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone && client.phone.includes(searchTerm))
  );

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
    onClientSelected(client?.id);
    setIsOpen(false);
    setSearchTerm('');
    // Log removido para optimización
  };

  const inputCls = 'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-neutral-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent px-3 py-2';

  return (
    <div className="relative">
      <label className="block">
        <span className="text-sm text-zinc-700 dark:text-zinc-300">Cliente</span>
        
        {/* Campo de selección principal */}
        <div className="mt-1 relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`${inputCls} flex items-center justify-between`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-400" />
              <span className={selectedClient ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}>
                {selectedClient ? selectedClient.name : 'Sin cliente (walk-in)'}
              </span>
            </div>
            <Search className="w-4 h-4 text-zinc-400" />
          </button>

          {/* Botón para limpiar selección */}
          {selectedClient && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClientSelect(null);
              }}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              title="Sin cliente (walk-in)"
            >
              ×
            </button>
          )}
        </div>

        {/* Dropdown con búsqueda */}
        {isOpen && (
          <div className="absolute z-50 mt-1 mb-2 w-full bg-white dark:bg-neutral-900 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg max-h-100 overflow-hidden client-selector-dropdown">
            {/* Opción "Sin cliente" siempre visible arriba */}
            <div className="border-b border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => handleClientSelect(null)}
                className="w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-zinc-600 dark:text-zinc-400"
              >
                <User className="w-4 h-4" />
                Sin cliente (walk-in)
              </button>
            </div>

            {/* Campo de búsqueda */}
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={inputCls}
                autoFocus
              />
            </div>

            {/* Lista de clientes */}
            <div className="max-h-40 overflow-y-auto">

              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleClientSelect(client)}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-neutral-800 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{client.name}</div>
                      {client.phone && (
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">{client.phone}</div>
                      )}
                    </div>
                    {client.totalVisits > 0 && (
                      <div className="text-xs bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 px-2 py-1 rounded-full">
                        {client.totalVisits} visitas
                      </div>
                    )}
                  </div>
                </button>
              ))}

              {filteredClients.length === 0 && searchTerm && (
                <div className="px-3 py-2 text-zinc-500 dark:text-zinc-400 text-center">
                  No se encontraron clientes
                </div>
              )}
            </div>

            {/* Botón para crear nuevo cliente - SIEMPRE VISIBLE */}
            <div className="p-3 pb-6 border-t border-zinc-200 dark:border-zinc-700 bg-sky-50 dark:bg-sky-900/20">
              <button
                type="button"
                onClick={() => {
                  setShowNewClientForm(true);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-500 flex items-center gap-2 justify-center font-medium shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Crear nuevo cliente
              </button>
            </div>
          </div>
        )}
      </label>

      {/* Información del cliente seleccionado */}
      {selectedClient && (
        <div className="mt-2 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sky-900 dark:text-sky-100">{selectedClient.name}</div>
              <div className="text-sm text-sky-700 dark:text-sky-300">
                {selectedClient.totalVisits} visitas • {selectedClient.totalCancellations} cancelaciones
                {selectedClient.contactMethod && (
                  <span className="ml-2">• {selectedClient.contactMethod}</span>
                )}
              </div>
            </div>
          </div>
          <ClientLatestNote clientId={selectedClient.id} />
        </div>
      )}

      {/* Modal para crear nuevo cliente */}
      {showNewClientForm && (
        <NewClientModal
          onClose={() => setShowNewClientForm(false)}
          onClientCreated={(client) => {
            handleClientSelect(client);
            setShowNewClientForm(false);
            loadClients(); // Recargar lista
            onClientCreated?.(client);
          }}
          initialName={searchTerm}
        />
      )}
    </div>
  );
}

// Modal para crear nuevo cliente - SIN form tag
function NewClientModal({ 
  onClose, 
  onClientCreated, 
  initialName 
}: { 
  onClose: () => void; 
  onClientCreated: (client: Client) => void;
  initialName?: string;
}) {
  const [name, setName] = useState(initialName || '');
  const [phone, setPhone] = useState('');
  const [contactMethod, setContactMethod] = useState<'whatsapp' | 'instagram' | 'phone'>('whatsapp');
  const [contactHandle, setContactHandle] = useState('');
  const [notes, setNotes] = useState('');

  const inputCls = 'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-neutral-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent px-3 py-2';

  const handleSubmit = async () => {
    if (!name.trim()) return;

    try {
      // Preparar datos según el método de contacto
      let phoneData = undefined;
      let contactHandleData = undefined;

      if (contactMethod === 'instagram') {
        contactHandleData = contactHandle.trim() || undefined;
      } else {
        phoneData = phone.trim() || undefined;
        contactHandleData = phoneData; // Para WhatsApp y teléfono, el handle es el mismo número
      }

      // Solo pasar datos sin ID
      const clientData = {
        name: name.trim(),
        phone: phoneData,
        totalVisits: 0,
        totalCancellations: 0,
        contactMethod,
        contactHandle: contactHandleData,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString()
      };

      const clientId = await db.clients.add(clientData);
      // Log removido para optimización
      
      // Usar el ID retornado
      await db.clientHistory.add({
        clientId: clientId,
        eventType: 'client_created',
        timestamp: new Date().toISOString(),
        notes: `Cliente creado: ${clientData.name}`
      });
      
      // Crear objeto completo para callback
      const newClient: Client = { ...clientData, id: clientId };
      onClientCreated(newClient);
    } catch (error) {
      console.error('Error al crear cliente:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-xl w-full max-w-md space-y-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Nuevo Cliente</h3>
        
        <label className="block">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Nombre *</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className={inputCls}
            placeholder="Juan Pérez"
            autoFocus
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Método de contacto</span>
          <select
            value={contactMethod}
            onChange={(e) => setContactMethod(e.target.value as any)}
            className={inputCls}
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="phone">Teléfono</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            {contactMethod === 'instagram' ? '@usuario de Instagram' : 'Número de contacto'}
          </span>
          <input
            type={contactMethod === 'instagram' ? 'text' : 'tel'}
            value={contactMethod === 'instagram' ? contactHandle : phone}
            onChange={(e) => {
              if (contactMethod === 'instagram') {
                setContactHandle(e.target.value);
              } else {
                setPhone(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            className={inputCls}
            placeholder={contactMethod === 'instagram' ? '@juanperez' : '+54911234567'}
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Notas</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputCls}
            placeholder="Observaciones, preferencias..."
            rows={2}
          />
        </label>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-neutral-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex-1 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Crear Cliente
          </button>
        </div>
      </div>
    </div>
  );
}