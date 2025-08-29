'use client';
import { useState, useMemo } from 'react';
import { useMonthlyStats, useMonthlyTopServices } from '@/lib/queries';
import { useData, useDataInvalidation } from '@/app/context/DataProvider';
import { RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';

export default function StatsView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12

  // 🎯 DataProvider para obtener datos básicos
  const { appointments, clients, services } = useData();
  const { invalidateStats } = useDataInvalidation();
  
  // 🎯 Calcular datos para el gráfico de estados de turnos
  const appointmentStatusData = useMemo(() => {
    if (!appointments?.data) return [];
    
    const statusCounts = appointments.data.reduce((acc: Record<string, number>, apt: any) => {
      const status = apt.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const statusLabels = {
      pending: 'Pendiente',
      done: 'Completado', 
      cancelled: 'Cancelado'
    };
    
    const statusColors = {
      pending: '#3B82F6',    // Azul
      done: '#10B981',       // Verde
      cancelled: '#EF4444'   // Rojo
    };
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      status: statusLabels[status as keyof typeof statusLabels] || status,
      count,
      color: statusColors[status as keyof typeof statusColors] || '#6B7280'
    }));
  }, [appointments]);
  
  // 🔥 Usar hooks de React Query en lugar de useState y useEffect
  const { 
    data: monthlyStats, 
    isLoading: isLoadingStats,
    error: statsError 
  } = useMonthlyStats(year, month);

  const { 
    data: topServices = [], 
    isLoading: isLoadingTop,
    error: topError 
  } = useMonthlyTopServices(year, month);



  const COLORS = [
    '#3B82F6', // azul medio
    '#34D399', // verde menta
    '#FBBF24', // dorado suave
    '#F87171', // coral/rojo claro
    '#A78BFA', // violeta lavanda
  ];

  const currency = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0
  });

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const isLoading = isLoadingStats || isLoadingTop;
  const hasError = statsError || topError;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="animate-spin w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full flex-shrink-0"></div>
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-6 max-w-full overflow-hidden">
      {/* selector de mes y año con botón de refresh */}
      <div className="flex gap-2 justify-center flex-wrap items-center">
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="border rounded px-2 py-1 dark:bg-neutral-900"
          disabled={isLoading}
        >
          {months.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>

        <input
          type="number"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="w-24 border rounded px-2 py-1 dark:bg-neutral-900"
          disabled={isLoading}
        />
        
        {/* 🎯 Botón de refresh para forzar actualización de estadísticas */}
        <button
          onClick={() => invalidateStats()}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Actualizar estadísticas"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Actualizar</span>
        </button>
      </div>

      {/* Error state */}
      {hasError && (
        <div className="text-center py-8 text-red-500">
          <p>Error al cargar las estadísticas</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Content - solo mostrar si no hay loading ni error */}
      {!isLoading && !hasError && (
        <>
          {/* resumen */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded bg-zinc-100 dark:bg-neutral-800">
              <p className="text-sm text-zinc-500">Ingresos</p>
              <p className="text-lg font-bold">
                {currency.format(monthlyStats?.income ?? 0)}
              </p>
            </div>
            <div className="p-3 rounded bg-zinc-100 dark:bg-neutral-800">
              <p className="text-sm text-zinc-500">Turnos completados</p>
              <p className="text-lg font-bold">{monthlyStats?.count ?? 0}</p>
            </div>
            <div className="p-3 rounded bg-zinc-100 dark:bg-neutral-800">
              <p className="text-sm text-zinc-500">Total de turnos</p>
              <p className="text-lg font-bold">{appointments?.data?.length ?? 0}</p>
            </div>
          </div>

          {/* gráficos */}
          <div className="grid md:grid-cols-3 gap-6 justify-center">
            {/* Servicios más vendidos - Siempre barra vertical */}
            <div className="card p-3" style={{ minHeight: '320px' }}>
              <h3 className="text-center font-medium mb-2">Servicios más vendidos</h3>
              
              <div className="w-full h-72 overflow-x-auto">
                <div className="min-w-[350px] h-full">
                  <BarChart width={350} height={250} data={topServices}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="service" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#8884d8" />
                  </BarChart>
                </div>
              </div>
            </div>

            {/* Distribución de ingresos - Responsive */}
            <div className="card p-3" style={{ minHeight: '320px' }}>
              <h3 className="text-center font-medium mb-2">Distribución de ingresos</h3>
              
              <div className="w-full h-72 overflow-x-auto">
                <div className="min-w-[350px] h-full">
                  <BarChart width={350} height={250} data={topServices}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="service" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#82ca9d" />
                  </BarChart>
                </div>
              </div>
            </div>

            {/* Estados de Turnos - Responsive */}
            <div className="card p-3" style={{ minHeight: '320px' }}>
              <h3 className="text-center font-medium mb-2">Estados de Turnos</h3>
              
              <div className="w-full h-72 overflow-x-auto">
                <div className="min-w-[350px] h-full">
                  <BarChart width={350} height={250} data={appointmentStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ffc658" />
                  </BarChart>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}