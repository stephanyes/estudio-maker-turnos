'use client';
import { useState, useMemo } from 'react';
import { db, Client } from '@/lib/supabase-db';
import { useData } from '@/app/context/DataProvider';
import { DateTime } from 'luxon';
import { User, Phone, MessageCircle, Instagram, Calendar, TrendingUp, TrendingDown, Search } from 'lucide-react';

export default function ClientsView() {
  // const [clients, setClients] = useState<Client[]>([]);
  // const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'lastVisit' | 'totalVisits' | 'created'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'inactive' | 'new'>('all');
  // const [stats, setStats] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // 🎯 DataProvider para obtener todos los datos
  const { clients, loading } = useData();
  
  // Por ahora, stats se calcula localmente
  // TODO: Agregar stats al DataProvider
  const stats = null as {
    totalClients: number;
    activeClients: number;
    atRisk: number;
    totalVisits: number;
  } | null;
  

  // useEffect(() => {
  //   loadClients();
  //   loadStats();
  // }, []);

  // useEffect(() => {
  //   filterAndSortClients();
  // }, [clients, searchTerm, sortBy, filterBy]);

  // const loadClients = async () => {
  //   const allClients = await db.clients.toArray();
  //   setClients(allClients);
  // };

  // const loadStats = async () => {
  //   const clientStats = await getClientStats();
  //   setStats(clientStats);
  // };

const filteredClients = useMemo(() => {
  let filtered = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone && client.phone.includes(searchTerm));

    if (!matchesSearch) return false;

    const now = DateTime.now();
    const thirtyDaysAgo = now.minus({ days: 30 });

    switch (filterBy) {
      case 'active':
        return client.lastVisit && DateTime.fromISO(client.lastVisit) > thirtyDaysAgo;
      case 'inactive':
        if (!client.lastVisit) {
          return DateTime.fromISO(client.createdAt) < thirtyDaysAgo;
        }
        return DateTime.fromISO(client.lastVisit) < thirtyDaysAgo;
      case 'new':
        const sevenDaysAgo = now.minus({ days: 7 });
        return DateTime.fromISO(client.createdAt) > sevenDaysAgo;
      default:
        return true;
    }
  });

  // Ordenar
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'lastVisit':
        if (!a.lastVisit && !b.lastVisit) return 0;
        if (!a.lastVisit) return 1;
        if (!b.lastVisit) return -1;
        return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
      case 'totalVisits':
        return b.totalVisits - a.totalVisits;
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  return filtered;
}, [clients, searchTerm, sortBy, filterBy]);

  const getDaysSinceLastVisit = (client: Client) => {
    if (!client.lastVisit) {
      return Math.floor(DateTime.now().diff(DateTime.fromISO(client.createdAt), 'days').days);
    }
    return Math.floor(DateTime.now().diff(DateTime.fromISO(client.lastVisit), 'days').days);
  };

  const getContactIcon = (method?: string) => {
    switch (method) {
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'phone': return <Phone className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const inputCls = "rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-neutral-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent px-3 py-2";

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      {stats !== null && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.totalClients}</div>
                <div className="text-sm text-zinc-500">Total clientes</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.activeClients}</div>
                <div className="text-sm text-zinc-500">Activos (30 días)</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.atRisk}</div>
                <div className="text-sm text-zinc-500">En riesgo</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.totalVisits}</div>
                <div className="text-sm text-zinc-500">Total visitas</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controles de filtrado y búsqueda */}
      <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputCls} pl-10`}
            />
          </div>

          {/* Filtros */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
            className={inputCls}
          >
            <option value="all">Todos los clientes</option>
            <option value="active">Activos (30 días)</option>
            <option value="inactive">Inactivos (+30 días)</option>
            <option value="new">Nuevos (7 días)</option>
          </select>

          {/* Ordenamiento */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={inputCls}
          >
            <option value="name">Ordenar por nombre</option>
            <option value="lastVisit">Por última visita</option>
            <option value="totalVisits">Por total visitas</option>
            <option value="created">Por fecha creación</option>
          </select>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Clientes ({filteredClients.length})
          </h3>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {filteredClients.map((client) => {
            const daysSinceLastVisit = getDaysSinceLastVisit(client);
            const isAtRisk = daysSinceLastVisit > 30;
            const isNew = DateTime.now().diff(DateTime.fromISO(client.createdAt), 'days').days < 7;

            return (
              <div
                key={client.id}
                className="p-4 hover:bg-zinc-50 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                onClick={() => setSelectedClient(client)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900 rounded-full flex items-center justify-center">
                        <span className="text-sky-600 dark:text-sky-400 font-medium">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {client.name}
                        </h4>
                        {isNew && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-full">
                            Nuevo
                          </span>
                        )}
                        {isAtRisk && (
                          <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs rounded-full">
                            En riesgo
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center gap-1">
                          {getContactIcon(client.contactMethod)}
                          <span>{client.phone || 'Sin teléfono'}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {client.lastVisit 
                              ? `Última visita: hace ${daysSinceLastVisit} días`
                              : `Creado hace ${daysSinceLastVisit} días`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                    <div className="text-center">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{client.totalVisits}</div>
                      <div className="text-xs">Visitas</div>
                    </div>
                    
                    {client.totalCancellations > 0 && (
                      <div className="text-center">
                        <div className="font-medium text-red-500">{client.totalCancellations}</div>
                        <div className="text-xs">Cancel.</div>
                      </div>
                    )}
                  </div>
                </div>

                {client.notes && (
                  <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 italic pl-13">
                    "{client.notes}"
                  </div>
                )}
              </div>
            );
          })}

          {filteredClients.length === 0 && (
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
              <User className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>No se encontraron clientes</p>
              {searchTerm && (
                <p className="text-sm mt-1">
                  Intentá con otros términos de búsqueda
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalle del cliente */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onUpdated={() => {
            // loadClients();
            // loadStats();
            setSelectedClient(null);
          }}
        />
      )}
    </div>
  );
}

// Modal de detalle del cliente
function ClientDetailModal({
  client,
  onClose,
  onUpdated
}: {
  client: Client;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<Client>({ ...client });

  const inputCls = "w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-neutral-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent px-3 py-2";

  const handleSave = async () => {
    await db.clients.update(client.id, editedClient);
    setIsEditing(false);
    onUpdated();
  };

  const daysSinceLastVisit = client.lastVisit 
    ? Math.floor(DateTime.now().diff(DateTime.fromISO(client.lastVisit), 'days').days)
    : Math.floor(DateTime.now().diff(DateTime.fromISO(client.createdAt), 'days').days);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {client.name}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              ×
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          {/* Estadísticas del cliente */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-zinc-50 dark:bg-neutral-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{client.totalVisits}</div>
              <div className="text-sm text-zinc-500">Total visitas</div>
            </div>
            <div className="text-center p-3 bg-zinc-50 dark:bg-neutral-800 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{daysSinceLastVisit}</div>
              <div className="text-sm text-zinc-500">Días sin venir</div>
            </div>
          </div>

          {/* Información del cliente */}
          <div className="space-y-3">
            {isEditing ? (
              <>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre</span>
                  <input
                    type="text"
                    value={editedClient.name}
                    onChange={(e) => setEditedClient({ ...editedClient, name: e.target.value })}
                    className={inputCls}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Teléfono</span>
                  <input
                    type="tel"
                    value={editedClient.phone || ''}
                    onChange={(e) => setEditedClient({ ...editedClient, phone: e.target.value })}
                    className={inputCls}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Método de contacto</span>
                  <select
                    value={editedClient.contactMethod || 'whatsapp'}
                    onChange={(e) => setEditedClient({ ...editedClient, contactMethod: e.target.value as any })}
                    className={inputCls}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="phone">Teléfono</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Handle de contacto</span>
                  <input
                    type="text"
                    value={editedClient.contactHandle || ''}
                    onChange={(e) => setEditedClient({ ...editedClient, contactHandle: e.target.value })}
                    className={inputCls}
                    placeholder={editedClient.contactMethod === 'instagram' ? '@usuario' : '+54911234567'}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Notas</span>
                  <textarea
                    value={editedClient.notes || ''}
                    onChange={(e) => setEditedClient({ ...editedClient, notes: e.target.value })}
                    className={inputCls}
                    rows={3}
                  />
                </label>
              </>
            ) : (
              <>
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Teléfono:</span>
                  <p className="text-zinc-900 dark:text-zinc-100">{client.phone || 'No especificado'}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Contacto:</span>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {client.contactMethod || 'No especificado'} 
                    {client.contactHandle && ` - ${client.contactHandle}`}
                  </p>
                </div>

                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Última visita:</span>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {client.lastVisit 
                      ? DateTime.fromISO(client.lastVisit).toLocaleString(DateTime.DATETIME_MED)
                      : 'Nunca'
                    }
                  </p>
                </div>

                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Cliente desde:</span>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {DateTime.fromISO(client.createdAt).toLocaleString(DateTime.DATE_MED)}
                  </p>
                </div>

                {client.notes && (
                  <div>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Notas:</span>
                    <p className="text-zinc-900 dark:text-zinc-100 italic">"{client.notes}"</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-700 flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500"
              >
                Guardar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-neutral-800"
              >
                Cerrar
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500"
              >
                Editar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}