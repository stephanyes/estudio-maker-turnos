'use client';
import React from 'react';
import { useData } from '@/app/context/DataProvider';

export default function StatsBar() {
  const { stats, loading, hasErrors } = useData();
  const { today, week, month } = stats;

  const StatCard = ({
    label,
    value,
    icon,
    isLoading = false,
  }: {
    label: string;
    value: number;
    icon: React.ReactNode;
    isLoading?: boolean;
  }) => (
    <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm text-center sm:text-left">
      <div className="flex items-center justify-center sm:justify-between gap-3 sm:gap-2 mb-2">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-700">
          {icon}
        </span>
      </div>
      <div className="text-3xl font-semibold tabular-nums">
        {isLoading ? (
          <div className="animate-pulse bg-zinc-200 h-9 w-12 rounded mx-auto sm:mx-0"></div>
        ) : (
          value
        )}
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-md mx-auto sm:max-w-none">
      <StatCard
        label="Turnos hoy"
        value={today}
        isLoading={loading.any}
        icon={
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
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
        value={week}
        isLoading={loading.any}
        icon={
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
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
        value={month}
        isLoading={loading.any}
        icon={
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
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