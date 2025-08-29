'use client';
import { useState } from 'react';
import { DateTime } from 'luxon';
import { useDailyRevenue, useDailyTraffic } from '@/lib/queries';
import { useData } from '@/app/context/DataProvider';
import { Calendar, DollarSign, CreditCard, Banknote, ArrowLeftRight, Users, Clock, Plus, Edit3 } from 'lucide-react';
import WalkInForm from './WalkInForm';
import { Appointment, WalkIn } from '@/lib/supabase-db';

export default function DailyRevenueView() {
  const [selectedDate, setSelectedDate] = useState(DateTime.now().toFormat('yyyy-LL-dd'));
  const [showWalkInForm, setShowWalkInForm] = useState(false);

  // 🎯 DataProvider para obtener datos básicos
  const { appointments, walkIns } = useData();
  
  const { 
    data: revenueData, 
    isLoading: revenueLoading, 
    error: revenueError 
  } = useDailyRevenue(selectedDate);

  const { 
    data: trafficData, 
    isLoading: trafficLoading 
  } = useDailyTraffic(selectedDate);

  const isLoading = revenueLoading || trafficLoading;

  const currency = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0
  });

  const formatTime = (isoString: string) => {
    return DateTime.fromISO(isoString).toFormat('HH:mm');
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4 text-green-600" />;
      case 'card': return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'transfer': return <ArrowLeftRight className="w-4 h-4 text-purple-600" />;
      default: return <DollarSign className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status?: string, paymentStatus?: string) => {
    if (status === 'done' && paymentStatus === 'paid') {
      return 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
    } else if (status === 'done' && paymentStatus === 'pending') {
      return 'bg-yellow-100 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
    } else if (status === 'cancelled') {
      return 'bg-red-100 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
    } else {
      return 'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="animate-spin w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full flex-shrink-0"></div>
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">Cargando información del día...</span>
        </div>
      </div>
    );
  }

  if (revenueError) {
    return (
      <div className="text-center py-12 text-red-500">
        <p className="mb-4">Error al cargar los datos del día</p>
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
      {/* Header con selector de fecha */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-sky-600" />
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Agenda del Día
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={DateTime.now().toFormat('yyyy-LL-dd')}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-neutral-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          
          <button
            onClick={() => setShowWalkInForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500"
          >
            <Plus className="w-4 h-4" />
            Registrar Walk-in
          </button>
        </div>
      </div>

      {/* Estadísticas del día */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {currency.format(revenueData?.totalRevenue || 0)}
              </div>
              <div className="text-sm text-zinc-500">Revenue Total</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {trafficData?.total || 0}
              </div>
              <div className="text-sm text-zinc-500">Personas Atendidas</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">
                {currency.format(revenueData?.cashRevenue || 0)}
              </div>
              <div className="text-sm text-zinc-500">Efectivo</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {currency.format(revenueData?.pendingRevenue || 0)}
              </div>
              <div className="text-sm text-zinc-500">Pendiente</div>
            </div>
          </div>
        </div>
      </div>

      {/* Desglose por método de pago */}
      <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Desglose por método de pago</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-green-600" />
              <span className="font-medium">Efectivo</span>
            </div>
            <span className="font-bold text-green-600">
              {currency.format(revenueData?.cashRevenue || 0)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Tarjeta</span>
            </div>
            <span className="font-bold text-blue-600">
              {currency.format(revenueData?.cardRevenue || 0)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Transferencia</span>
            </div>
            <span className="font-bold text-purple-600">
              {currency.format(revenueData?.transferRevenue || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de servicios del día */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Citas programadas */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Citas programadas ({revenueData?.appointments.length || 0})
            </h3>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-700 max-h-96 overflow-y-auto">
            {revenueData?.appointments.map((appointment: Appointment) => (
              <div key={appointment.id} className="p-4">
                <div className={`rounded-lg border p-3 ${getStatusColor(appointment.status, appointment.paymentStatus)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {formatTime(appointment.startDateTime)}
                        </span>
                        <span className="px-2 py-0.5 bg-white/50 rounded text-xs">
                          {appointment.durationMin}min
                        </span>
                      </div>
                      <div className="text-sm">
                        {appointment.title || 'Turno sin título'}
                      </div>
                      {appointment.paymentNotes && (
                        <div className="text-xs mt-1 opacity-75">
                          {appointment.paymentNotes}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      {appointment.paymentMethod && (
                        <div className="flex items-center gap-1 mb-1">
                          {getPaymentIcon(appointment.paymentMethod)}
                          <span className="text-xs capitalize">{appointment.paymentMethod}</span>
                        </div>
                      )}
                      {appointment.finalPrice && (
                        <div className="font-bold">
                          {currency.format(appointment.finalPrice)}
                        </div>
                      )}
                      {appointment.discount && appointment.discount > 0 && (
                        <div className="text-xs text-green-600">
                          -{appointment.discount}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {(!revenueData?.appointments || revenueData.appointments.length === 0) && (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p>No hay citas programadas para este día</p>
              </div>
            )}
          </div>
        </div>

        {/* Walk-ins */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Walk-ins ({revenueData?.walkIns.length || 0})
            </h3>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-700 max-h-96 overflow-y-auto">
            {revenueData?.walkIns.map((walkIn: WalkIn) => (
              <div key={walkIn.id} className="p-4">
                <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {formatTime(walkIn.timestamp)}
                        </span>
                        <span className="px-2 py-0.5 bg-white/50 rounded text-xs">
                          {walkIn.duration}min
                        </span>
                      </div>
                      <div className="text-sm">
                        {walkIn.serviceName || 'Walk-in'}
                      </div>
                      {walkIn.notes && (
                        <div className="text-xs mt-1 opacity-75">
                          {walkIn.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        {getPaymentIcon(walkIn.paymentMethod)}
                        <span className="text-xs capitalize">{walkIn.paymentMethod}</span>
                      </div>
                      <div className="font-bold text-green-700 dark:text-green-300">
                        {currency.format(walkIn.finalPrice)}
                      </div>
                      {walkIn.discount && walkIn.discount > 0 && (
                        <div className="text-xs text-green-600">
                          -{walkIn.discount}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {(!revenueData?.walkIns || revenueData.walkIns.length === 0) && (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p>No hay walk-ins registrados para este día</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de walk-in */}
      {showWalkInForm && (
        <WalkInForm
          defaultDate={selectedDate}
          onClose={() => setShowWalkInForm(false)}
          onSaved={() => setShowWalkInForm(false)}
        />
      )}
    </div>
  );
}