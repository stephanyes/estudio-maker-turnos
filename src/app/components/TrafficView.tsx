'use client';
import { useState, useMemo } from 'react';
import { DateTime } from 'luxon';
import { useTrafficForPeriod } from '@/lib/queries';
import { useData } from '@/app/context/DataProvider';
import { Users, Calendar, TrendingUp, BarChart3, Clock } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

export default function TrafficView() {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(DateTime.now().toFormat('yyyy-LL-dd'));

  // Obtener datos para el rango seleccionado
  const dates = useMemo(() => {
    const baseDate = DateTime.fromFormat(selectedDate, 'yyyy-LL-dd');
    if (viewMode === 'week') {
      const startOfWeek = baseDate.startOf('week');
      return Array.from({ length: 7 }, (_, i) => 
        startOfWeek.plus({ days: i }).toFormat('yyyy-LL-dd')
      );
    } else {
      const startOfMonth = baseDate.startOf('month');
      const daysInMonth = baseDate.daysInMonth || 30;
      return Array.from({ length: daysInMonth }, (_, i) => 
        startOfMonth.plus({ days: i }).toFormat('yyyy-LL-dd')
      );
    }
  }, [selectedDate, viewMode]);

  // 🎯 DataProvider para obtener datos básicos
  const { appointments, walkIns } = useData();
  
  // En lugar de usar hooks dinámicos, crear un hook personalizado
  const { data: trafficData, isLoading, error: hasError } = useTrafficForPeriod(dates);

  // Procesar datos para los gráficos
  const chartData = useMemo(() => {
    if (!trafficData) return [];
    
    return dates.map((date, index) => {
      const data = trafficData[index];
      const dateObj = DateTime.fromFormat(date, 'yyyy-LL-dd');
      
      return {
        date,
        dayName: dateObj.toFormat('ccc'), // Lun, Mar, etc
        dayNumber: dateObj.day,
        appointments: data?.appointments || 0,
        walkIns: data?.walkIns || 0,
        total: data?.total || 0,
      };
    });
  }, [dates, trafficData]);

  // Estadísticas del período
  const periodStats = useMemo(() => {
    const totalPeople = chartData.reduce((sum, day) => sum + day.total, 0);
    const totalAppointments = chartData.reduce((sum, day) => sum + day.appointments, 0);
    const totalWalkIns = chartData.reduce((sum, day) => sum + day.walkIns, 0);
    const avgDaily = totalPeople / chartData.length;
    
    const maxDay = chartData.reduce((max, day) => day.total > max.total ? day : max, chartData[0] || { total: 0 });
    
    return {
      totalPeople,
      totalAppointments,
      totalWalkIns,
      avgDaily: Math.round(avgDaily * 10) / 10,
      busiestDay: maxDay,
      daysWithData: chartData.filter(day => day.total > 0).length,
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <LoadingSpinner 
        message="Cargando estadísticas de tráfico..." 
        variant="black"
        size="large"
      />
    );
  }

  if (hasError) {
    return (
      <div className="text-center py-12 text-red-500">
        <p className="mb-4">Error al cargar las estadísticas de tráfico</p>
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-sky-600" />
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Tráfico de Personas
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'week' | 'month')}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-neutral-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="week">Vista Semanal</option>
            <option value="month">Vista Mensual</option>
          </select>

          <input
            type={viewMode === 'week' ? 'date' : 'month'}
            value={viewMode === 'week' ? selectedDate : selectedDate.substring(0, 7)}
            onChange={(e) => {
              if (viewMode === 'week') {
                setSelectedDate(e.target.value);
              } else {
                setSelectedDate(e.target.value + '-01');
              }
            }}
            max={DateTime.now().toFormat(viewMode === 'week' ? 'yyyy-LL-dd' : 'yyyy-LL')}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-neutral-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Estadísticas del período */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {periodStats.totalPeople}
              </div>
              <div className="text-sm text-zinc-500">Total Personas</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {periodStats.totalAppointments}
              </div>
              <div className="text-sm text-zinc-500">Con Cita</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {periodStats.totalWalkIns}
              </div>
              <div className="text-sm text-zinc-500">Walk-ins</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {periodStats.avgDaily}
              </div>
              <div className="text-sm text-zinc-500">Promedio Diario</div>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Resumen del {viewMode === 'week' ? 'período' : 'mes'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-zinc-500">Días con actividad:</span>
            <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">
              {periodStats.daysWithData} de {chartData.length}
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Día más ocupado:</span>
            <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">
              {periodStats.busiestDay ? 
                `${DateTime.fromFormat(periodStats.busiestDay.date, 'yyyy-LL-dd').toFormat('dd/LL')} (${periodStats.busiestDay.total} personas)` 
                : 'N/A'
              }
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Ratio Walk-ins:</span>
            <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-100">
              {periodStats.totalPeople > 0 ? 
                `${Math.round((periodStats.totalWalkIns / periodStats.totalPeople) * 100)}%` 
                : '0%'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras */}
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Tráfico diario - {viewMode === 'week' ? 'Semana' : 'Mes'}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey={viewMode === 'week' ? 'dayName' : 'dayNumber'}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} personas`,
                    name === 'appointments' ? 'Citas' : name === 'walkIns' ? 'Walk-ins' : 'Total'
                  ]}
                  labelFormatter={(label) => 
                    viewMode === 'week' 
                      ? `${label}` 
                      : `Día ${label}`
                  }
                />
                <Bar dataKey="appointments" stackId="a" fill="#3B82F6" name="appointments" />
                <Bar dataKey="walkIns" stackId="a" fill="#F59E0B" name="walkIns" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de línea de tendencia */}
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Tendencia total
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey={viewMode === 'week' ? 'dayName' : 'dayNumber'}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} personas`, 'Total']}
                  labelFormatter={(label) => 
                    viewMode === 'week' 
                      ? `${label}` 
                      : `Día ${label}`
                  }
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabla detallada */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Detalle por día
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-neutral-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Citas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Walk-ins
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  % Walk-ins
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {chartData.map((day, index) => {
                const walkInPercentage = day.total > 0 ? (day.walkIns / day.total) * 100 : 0;
                const isToday = day.date === DateTime.now().toFormat('yyyy-LL-dd');
                
                return (
                  <tr 
                    key={day.date}
                    className={`${isToday ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {DateTime.fromFormat(day.date, 'yyyy-LL-dd').toFormat('dd/LL/yyyy')}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {day.dayName}
                        </span>
                        {isToday && (
                          <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 text-xs rounded-full">
                            Hoy
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-green-500" />
                        {day.appointments}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-orange-500" />
                        {day.walkIns}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {day.total}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <span>{walkInPercentage.toFixed(1)}%</span>
                        <div className="w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(walkInPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {chartData.length === 0 && (
          <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No hay datos de tráfico para este período</p>
          </div>
        )}
      </div>
    </div>
  );
}