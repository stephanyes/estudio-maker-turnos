'use client';
import { useState, useMemo } from 'react';
import { useClientsAtRiskCached, useMarkReminderSent } from '@/lib/queries';
import { useData } from '@/app/context/DataProvider';
import { DateTime } from 'luxon';
import { AlertTriangle, Clock, User, Calendar, Phone, MessageCircle, Instagram, Settings, Filter, CheckCircle, Copy } from 'lucide-react';

type RiskLevel = 'low' | 'medium' | 'high';
type ClientAtRisk = {
  id: string;
  name: string;
  phone?: string;
  totalVisits: number;
  totalCancellations: number;
  lastVisit?: string;
  createdAt: string;
  contactMethod?: 'whatsapp' | 'instagram' | 'phone';
  contactHandle?: string;
  notes?: string;
  reminderSent?: string;
  daysSinceLastVisit: number;
  riskLevel: RiskLevel;
};

export default function FollowUpView() {
  const [dayThreshold, setDayThreshold] = useState(30);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel | 'all'>('all');
  const [showSettings, setShowSettings] = useState(false);

  // 🎯 DataProvider para obtener datos básicos
  const { clients } = useData();
  
  // React Query hooks
  const { 
    data: clientsAtRisk = [], 
    isLoading, 
    error 
  } = useClientsAtRiskCached(dayThreshold);

  const filteredClients = useMemo(() => {
    return clientsAtRisk.filter(client => {
      if (selectedRiskLevel === 'all') return true;
      return client.riskLevel === selectedRiskLevel;
    });
  }, [clientsAtRisk, selectedRiskLevel]);

  const stats = useMemo(() => {
    const total = clientsAtRisk.length;
    const high = clientsAtRisk.filter(c => c.riskLevel === 'high').length;
    const medium = clientsAtRisk.filter(c => c.riskLevel === 'medium').length;
    const low = clientsAtRisk.filter(c => c.riskLevel === 'low').length;
    return { total, high, medium, low };
  }, [clientsAtRisk]);

  const getRiskLevelColor = (level: RiskLevel) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'low': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    }
  };

  const getRiskLevelText = (level: RiskLevel) => {
    switch (level) {
      case 'high': return 'Alto riesgo';
      case 'medium': return 'Riesgo medio';
      case 'low': return 'Riesgo bajo';
    }
  };

  const inputCls = "rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-neutral-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent px-3 py-2";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="animate-spin w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full flex-shrink-0"></div>
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">Cargando clientes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p className="mb-4">Error al cargar clientes en seguimiento</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.total}</div>
              <div className="text-sm text-zinc-500">Total en seguimiento</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-red-500 rounded-full"></div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.high}</div>
              <div className="text-sm text-zinc-500">Alto riesgo (+60 días)</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-orange-500 rounded-full"></div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{stats.medium}</div>
              <div className="text-sm text-zinc-500">Riesgo medio (45-60 días)</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-yellow-500 rounded-full"></div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{stats.low}</div>
              <div className="text-sm text-zinc-500">Riesgo bajo (30-45 días)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Filtrar por riesgo:</span>
              <select
                value={selectedRiskLevel}
                onChange={(e) => setSelectedRiskLevel(e.target.value as any)}
                className={inputCls}
              >
                <option value="all">Todos los niveles</option>
                <option value="high">Alto riesgo</option>
                <option value="medium">Riesgo medio</option>
                <option value="low">Riesgo bajo</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Umbral:</span>
              <select
                value={dayThreshold}
                onChange={(e) => setDayThreshold(Number(e.target.value))}
                className={inputCls}
              >
                <option value={15}>15 días</option>
                <option value={21}>3 semanas</option>
                <option value={30}>30 días</option>
                <option value={45}>45 días</option>
                <option value={60}>60 días</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-neutral-800"
          >
            <Settings className="w-4 h-4" />
            Configurar
          </button>
        </div>

        {showSettings && (
          <div className="mt-4 p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-neutral-700">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-3">Configuración de seguimiento</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-yellow-600">Riesgo bajo:</span>
                <p className="text-zinc-600 dark:text-zinc-400">Entre {dayThreshold} y 45 días sin venir</p>
              </div>
              <div>
                <span className="font-medium text-orange-600">Riesgo medio:</span>
                <p className="text-zinc-600 dark:text-zinc-400">Entre 45 y 60 días sin venir</p>
              </div>
              <div>
                <span className="font-medium text-red-600">Alto riesgo:</span>
                <p className="text-zinc-600 dark:text-zinc-400">Más de 60 días sin venir</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de clientes en riesgo */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Clientes para seguimiento ({filteredClients.length})
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Clientes que no han venido en los últimos {dayThreshold}+ días
          </p>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {filteredClients.map((client) => (
            <ClientAtRiskCard
              key={client.id}
              client={client as ClientAtRisk}
            />
          ))}

          {filteredClients.length === 0 && (
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">No hay clientes en este nivel de riesgo</p>
              <p className="text-sm mt-1">
                {selectedRiskLevel === 'all' 
                  ? 'Todos tus clientes están activos o son nuevos'
                  : `Ningún cliente tiene ${getRiskLevelText(selectedRiskLevel as RiskLevel).toLowerCase()}`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente para cada cliente en riesgo
function ClientAtRiskCard({ client }: { client: ClientAtRisk }) {
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const markReminderMutation = useMarkReminderSent();

  const getContactIcon = (method?: string) => {
    switch (method) {
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'phone': return <Phone className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRiskLevelColor = (level: RiskLevel) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'low': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    }
  };

  const getRiskLevelText = (level: RiskLevel) => {
    switch (level) {
      case 'high': return 'Alto riesgo';
      case 'medium': return 'Riesgo medio';
      case 'low': return 'Riesgo bajo';
    }
  };

  const handleContact = async (method: 'whatsapp' | 'instagram' | 'copy') => {
    const handle = client.contactHandle || client.phone || '';
    
    try {
      switch (method) {
        case 'whatsapp':
          if (handle.startsWith('+')) {
            const cleanPhone = handle.replace(/[^\d]/g, '');
            const message = encodeURIComponent(`Hola ${client.name}! Te extrañamos en la barbería. ¿Te gustaría agendar un turno?`);
            window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
            
            // Usar mutación para marcar recordatorio
            await markReminderMutation.mutateAsync({ 
              clientId: client.id, 
              method: 'whatsapp' 
            });
            setSuccessMessage('Mensaje de WhatsApp enviado');
          }
          break;
        case 'instagram':
          if (handle.startsWith('@')) {
            window.open(`https://instagram.com/${handle.slice(1)}`, '_blank');
            
            // Usar mutación para marcar recordatorio
            await markReminderMutation.mutateAsync({ 
              clientId: client.id, 
              method: 'instagram' 
            });
            setSuccessMessage('Instagram abierto');
          }
          break;
        case 'copy':
          navigator.clipboard.writeText(handle);
          setSuccessMessage('Información copiada al portapapeles');
          break;
      }

      if (method !== 'copy') {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Error al contactar cliente:', error);
      setSuccessMessage('Error al procesar la acción');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }

    setShowContactOptions(false);
  };

  const lastReminderText = client.reminderSent 
    ? `Último recordatorio: ${DateTime.fromISO(client.reminderSent).toRelative()}`
    : 'Sin recordatorios enviados';

  return (
    <div className="p-4 hover:bg-zinc-50 dark:hover:bg-neutral-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900 rounded-full flex items-center justify-center">
              <span className="text-sky-600 dark:text-sky-400 font-medium">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {client.name}
              </h4>
              <span className={`px-2 py-0.5 text-xs rounded-full border ${getRiskLevelColor(client.riskLevel)}`}>
                {getRiskLevelText(client.riskLevel)}
              </span>
            </div>

            <div className="space-y-1 text-sm text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {client.lastVisit 
                      ? `Última visita: hace ${client.daysSinceLastVisit} días`
                      : `Sin visitas - creado hace ${client.daysSinceLastVisit} días`
                    }
                  </span>
                </div>

                {client.contactMethod && (
                  <div className="flex items-center gap-1">
                    {getContactIcon(client.contactMethod)}
                    <span>{client.contactMethod}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span>{client.totalVisits} visitas totales</span>
                {client.totalCancellations > 0 && (
                  <span className="text-orange-600">
                    {client.totalCancellations} cancelaciones
                  </span>
                )}
              </div>

              <div className="text-xs text-zinc-400">
                {lastReminderText}
              </div>
            </div>

            {client.notes && (
              <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 italic">
                "{client.notes}"
              </div>
            )}
          </div>
        </div>

        {/* Botones de contacto */}
        <div className="flex-shrink-0 ml-4 relative">
          {/* Notificación de éxito */}
          {showSuccess && (
            <div className="absolute -top-2 right-0 z-10 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2 shadow-lg min-w-[200px]">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                <CheckCircle className="w-4 h-4" />
                <span>{successMessage}</span>
              </div>
            </div>
          )}

          {!showContactOptions ? (
            <button
              onClick={() => setShowContactOptions(true)}
              className="px-3 py-2 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-500 transition-colors disabled:opacity-50"
              disabled={markReminderMutation.isPending}
            >
              {markReminderMutation.isPending ? 'Procesando...' : 'Contactar'}
            </button>
          ) : (
            <div className="flex flex-col gap-2 min-w-[120px]">
              {client.contactMethod === 'whatsapp' && client.contactHandle && (
                <button
                  onClick={() => handleContact('whatsapp')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-500 disabled:opacity-50"
                  disabled={markReminderMutation.isPending}
                >
                  <MessageCircle className="w-3 h-3" />
                  WhatsApp
                </button>
              )}

              {client.contactMethod === 'instagram' && client.contactHandle && (
                <button
                  onClick={() => handleContact('instagram')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-500 disabled:opacity-50"
                  disabled={markReminderMutation.isPending}
                >
                  <Instagram className="w-3 h-3" />
                  Instagram
                </button>
              )}

              <button
                onClick={() => handleContact('copy')}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-500"
              >
                <Copy className="w-3 h-3" />
                Copiar info
              </button>

              <button
                onClick={() => setShowContactOptions(false)}
                className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-neutral-800"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error de mutación */}
      {markReminderMutation.error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          Error: {markReminderMutation.error.message}
        </div>
      )}
    </div>
  );
}