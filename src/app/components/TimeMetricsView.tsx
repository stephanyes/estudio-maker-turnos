'use client';
import { useState, useMemo } from 'react';
import { DateTime } from 'luxon';
import { useTimeMetrics, useEmployeeProductivity } from '@/lib/queries';
import { useData } from '@/app/context/DataProvider';
import { useAuth } from '@/app/context/AuthContext';
import { Clock, TrendingUp, TrendingDown, Target, Users, BarChart3, RefreshCw } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { useQueryClient } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';

export default function TimeMetricsView() {
  const [startDate, setStartDate] = useState(
    DateTime.now().startOf('month').toFormat('yyyy-LL-dd')
  );
  const [endDate, setEndDate] = useState(
    DateTime.now().toFormat('yyyy-LL-dd')
  );
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const queryClient = useQueryClient();

  const startISO = `${startDate}T00:00:00.000Z`;
  const endISO = `${endDate}T23:59:59.999Z`;

  const { data: timeMetrics, isLoading: metricsLoading, refetch: refetchTimeMetrics } = useTimeMetrics(startISO, endISO);
  // 🎯 DataProvider para obtener todos los datos
  const { userProfiles } = useData();
  const { data: employeeProductivity, isLoading: productivityLoading } = useEmployeeProductivity(
    selectedEmployee === 'all' ? '' : selectedEmployee,
    startISO,
    endISO
  );

  // 🎯 Función para refrescar datos
  const handleRefresh = async () => {
    // Log removido para optimización
    await queryClient.invalidateQueries({ queryKey: ['timeMetrics'] });
    await refetchTimeMetrics();
  };

  // Preparar datos para gráfico de dispersión (estimado vs real)
  const scatterData = useMemo(() => {
    if (!timeMetrics) return [];
    
    const data = timeMetrics.appointmentDetails.map(apt => ({
      estimated: apt.estimated,
      actual: apt.actual,
      variance: apt.variance,
      title: apt.serviceName || apt.title || 'Turno',
      id: apt.id
    }));
    
    // Log removido para optimización
    
    return data;
  }, [timeMetrics]);

  // Log removido para optimización

  // Datos para gráfico de barras de variación
  const varianceData = useMemo(() => {
    if (!timeMetrics) return [];
    
    const ranges = [
      { name: 'Muy rápido (-20%+)', min: -100, max: -20, count: 0, color: '#10B981' },
      { name: 'Rápido (-10 a -20%)', min: -20, max: -10, count: 0, color: '#34D399' },
      { name: 'Preciso (-10% a +10%)', min: -10, max: 10, count: 0, color: '#3B82F6' },
      { name: 'Lento (+10 a +20%)', min: 10, max: 20, count: 0, color: '#F59E0B' },
      { name: 'Muy lento (+20%+)', min: 20, max: 100, count: 0, color: '#EF4444' }
    ];

    timeMetrics.appointmentDetails.forEach(apt => {
      const range = ranges.find(r => apt.variance >= r.min && apt.variance < r.max);
      if (range) range.count++;
    });

    return ranges;
  }, [timeMetrics]);

  const currency = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0
  });

  const isLoading = metricsLoading || productivityLoading;

  if (isLoading && !timeMetrics) {
    return (
      <LoadingSpinner 
        message="Cargando métricas de tiempo..." 
        variant="black"
        size="large"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-sky-600" />
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Métricas de Tiempo
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              max={DateTime.now().toFormat('yyyy-LL-dd')}
            />
          </div>

          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          >
            <option value="all">Todos los empleados</option>
            {userProfiles?.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>

          {/* 🎯 Botón de refrescar */}
          <button
            onClick={handleRefresh}
            disabled={metricsLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-neutral-900 text-sm hover:bg-zinc-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refrescar datos"
          >
            <RefreshCw size={16} className={metricsLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>
        </div>
      </div>

      {/* Métricas generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {timeMetrics?.totalServices || 0}
              </div>
              <div className="text-sm text-zinc-500">Servicios completados</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-green-600">
                {timeMetrics?.accuracyRate || 0}%
              </div>
              <div className="text-sm text-zinc-500">Precisión estimaciones</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {timeMetrics?.avgActualMinutes || 0}min
              </div>
              <div className="text-sm text-zinc-500">Promedio real</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            {timeMetrics && timeMetrics.avgActualMinutes > timeMetrics.avgEstimatedMinutes ? (
              <TrendingUp className="w-5 h-5 text-red-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-green-500" />
            )}
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {timeMetrics?.avgVariancePercent || 0}%
              </div>
              <div className="text-sm text-zinc-500">Variación promedio</div>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Resumen del período
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-zinc-500">Tiempo total estimado:</span>
            <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">
              {timeMetrics ? Math.round(timeMetrics.totalEstimatedMinutes / 60 * 10) / 10 : 0}h
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Tiempo total real:</span>
            <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">
              {timeMetrics ? Math.round(timeMetrics.totalActualMinutes / 60 * 10) / 10 : 0}h
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Diferencia:</span>
            <span className={`ml-2 font-medium ${
              timeMetrics && timeMetrics.totalActualMinutes > timeMetrics.totalEstimatedMinutes 
                ? 'text-red-600' : 'text-green-600'
            }`}>
              {timeMetrics ? 
                (timeMetrics.totalActualMinutes > timeMetrics.totalEstimatedMinutes ? '+' : '') +
                Math.round((timeMetrics.totalActualMinutes - timeMetrics.totalEstimatedMinutes) / 60 * 10) / 10 + 'h'
                : '0h'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Productividad por empleado (si hay uno seleccionado) */}
      {selectedEmployee !== 'all' && employeeProductivity && (
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            Productividad: {userProfiles?.find(u => u.id === selectedEmployee)?.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">Servicios realizados:</span>
              <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">
                {employeeProductivity.totalServices}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Revenue generado:</span>
              <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">
                {currency.format(employeeProductivity.totalRevenue)}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Revenue/minuto:</span>
              <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">
                {currency.format(employeeProductivity.revenuePerMinute)}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Tiempo promedio/servicio:</span>
              <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">
                {employeeProductivity.avgMinutesPerService}min
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras de distribución de varianza */}
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Distribución de precisión
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={varianceData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} servicios`, 'Cantidad']}
                />
                <Bar dataKey="count">
                  {varianceData.map((entry, index) => (
                    <Bar key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de barras comparativas estimado vs real */}
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Estimado vs Real por Servicio
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scatterData.slice(0, 10)}> {/* Mostrar solo los primeros 10 servicios */}
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="title" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Tiempo (minutos)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} min`,
                    name === 'estimated' ? 'Estimado' : 'Real'
                  ]}
                  labelFormatter={(label) => `Servicio: ${label}`}
                />
                <Legend />
                <Bar dataKey="estimated" fill="#3B82F6" name="Estimado" />
                <Bar dataKey="actual" fill="#10B981" name="Real" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Comparación directa entre tiempo estimado y tiempo real por servicio. Barras azules = estimado, verdes = real.
          </p>
        </div>

        {/* Gráfico de líneas de tendencia temporal */}
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Tendencia Estimado vs Real
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scatterData.slice(0, 15)}> {/* Mostrar los últimos 15 servicios */}
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="title" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Tiempo (minutos)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} min`,
                    name === 'estimated' ? 'Estimado' : 'Real'
                  ]}
                  labelFormatter={(label) => `Servicio: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="estimated" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Estimado"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Real"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Evolución del tiempo estimado vs real a lo largo de los servicios. Línea azul = estimado, verde = real.
          </p>
        </div>
      </div>

      {/* Tabla detallada de servicios */}
      {timeMetrics && timeMetrics.appointmentDetails.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Detalle de servicios
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">
                    Servicio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">
                    Estimado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">
                    Real
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-700 uppercase">
                    Variación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {timeMetrics.appointmentDetails.slice(0, 20).map((apt) => (
                  <tr key={apt.id}>
                    <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                      {apt.serviceName || apt.title || 'Turno'}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">
                      {apt.estimated}min
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">
                      {apt.actual}min
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        apt.variance > 10 ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                        apt.variance < -10 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-red-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      }`}>
                        {apt.variance > 0 ? '+' : ''}{apt.variance}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">
                      {DateTime.fromISO(apt.date).toFormat('dd/LL HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!timeMetrics || timeMetrics.totalServices === 0) && (
        <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p>No hay datos de tiempo para este período</p>
          <p className="text-sm">Los servicios deben tener tiempo de inicio y finalización registrados</p>
        </div>
      )}
    </div>
  );
}