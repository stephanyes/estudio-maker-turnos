'use client';
import React from 'react';
import { useData } from '@/app/context/DataProvider';

export default function StatsBar() {
  const { stats, loading, hasErrors } = useData();
  const { today, week, month } = stats;

  const StatCard = ({
    label,
    shortLabel,
    value,
    icon,
    isLoading = false,
  }: {
    label: string;
    shortLabel: string;
    value: number;
    icon: React.ReactNode;
    isLoading?: boolean;
  }) => (
    <div 
      className="rounded-2xl border border-zinc-200 bg-white/70 p-3 shadow-sm text-center flex-1 min-w-0 group relative"
      title={label} // Tooltip nativo para mobile
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-xs text-zinc-500 truncate">
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </span>
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-700 flex-shrink-0">
          {icon}
        </span>
      </div>
      <div className="text-2xl sm:text-3xl font-semibold tabular-nums">
        {isLoading ? (
          <div className="animate-pulse bg-zinc-200 h-8 w-10 rounded mx-auto"></div>
        ) : (
          value
        )}
      </div>
      
      {/* Tooltip personalizado para desktop */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  );

  // Si hay error, mostrar estado de error simple
  if (hasErrors && !loading.any) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="text-sm text-red-600">
          Error cargando estadísticas
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 sm:gap-3 max-w-md mx-auto sm:max-w-none overflow-x-auto">
      <StatCard
        label="Turnos hoy"
        shortLabel="Hoy"
        value={today}
        isLoading={loading.any}
        icon={
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
            <path 
              d="M7 2v3M17 2v3M3 8h18M4 6h16a1 1 0 011 1v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a1 1 0 011-1z" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.7" 
              strokeLinecap="round" 
            />
          </svg>
        }
      />
      <StatCard
        label="Turnos esta semana"
        shortLabel="Semana"
        value={week}
        isLoading={loading.any}
        icon={
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
            <path 
              d="M4 5h16M4 10h16M4 15h10" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.7" 
              strokeLinecap="round" 
            />
          </svg>
        }
      />
      <StatCard
        label="Turnos este mes"
        shortLabel="Mes"
        value={month}
        isLoading={loading.any}
        icon={
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
            <path 
              d="M7 3v3m10-3v3M4 8h16M5 6h14a1 1 0 011 1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a1 1 0 011-1z" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.7" 
              strokeLinecap="round" 
            />
          </svg>
        }
      />
    </div>
  );
}