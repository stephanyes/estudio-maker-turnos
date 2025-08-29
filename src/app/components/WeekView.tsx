'use client';
import { Fragment, MouseEvent, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import { fmtDay, fmtTime } from '@/lib/time';
import AppointmentForm from './AppointmentForm';
import { useData } from '@/app/context/DataProvider';

export type Occ = {
  id: string;
  start: string;
  end: string;
  title?: string;
  clientId?: string;
  status?: 'pending' | 'done' | 'cancelled';
  price?: number;
  startedAt?: string;
  completedAt?: string;
  actualDurationMin?: number;
  serviceId: string;
  assignedTo?: string;
};

type EditTarget = { baseId: string; start: string; end: string; title?: string };
type Props = { onChanged?: () => void };

const DAY_COLS = 7;
const SLOT_MIN = 15;
const START_HOUR = 9;
const END_HOUR = 24;

function slotISO(day: DateTime, hour: number, minute: number): string {
  return day.set({ hour, minute, second: 0, millisecond: 0 }).toISO({ suppressMilliseconds: true })!;
}
function nextQuarterISO(ref = DateTime.now()): string {
  const q = Math.ceil(ref.minute / 15) * 15;
  const hour = ref.hour + Math.floor(q / 60);
  const minute = q % 60;
  return ref.set({ hour, minute, second: 0, millisecond: 0 }).toISO({ suppressMilliseconds: true })!;
}

function groupOccurrencesByDayHour(items: Occ[]) {
  const groups: Record<string, Record<string, Occ[]>> = {};
  items.forEach((occ) => {
    const start = DateTime.fromISO(occ.start);
    const dayKey = start.toFormat('yyyy-LL-dd');
    const hourMinKey = start.toFormat('HH:mm');
    if (!groups[dayKey]) groups[dayKey] = {};
    if (!groups[dayKey][hourMinKey]) groups[dayKey][hourMinKey] = [];
    groups[dayKey][hourMinKey].push(occ);
  });
  return groups;
}

function hueFromId(id: string) {
  return Math.abs(
    id.split('').reduce((acc, ch) => ch.charCodeAt(0) + ((acc << 5) - acc), 0)
  ) % 360;
}

export default function WeekView({ onChanged }: Props) {
  const [ref, setRef] = useState(DateTime.now());
  const [openFormAt, setOpenFormAt] = useState<string | undefined>();
  const [editing, setEditing] = useState<EditTarget | undefined>();
  const [scale, setScale] = useState(1);

  // 🎯 DataProvider para obtener todos los datos
  const { 
    appointments, 
    userProfiles, 
    loading,
    hasErrors
  } = useData();
  
  // Procesar ocurrencias de la semana actual usando los datos del DataProvider
  const items = useMemo(() => {
    if (!appointments.data.length) return [];
    
    // Simular la lógica de getOccurrences para la semana actual
    const startWeek = ref.startOf('week');
    const endWeek = ref.endOf('week');
    
    // Filtrar citas de la semana actual
    return appointments.data.filter((appointment: any) => {
      const appointmentDate = DateTime.fromISO(appointment.startDateTime);
      return appointmentDate >= startWeek && appointmentDate <= endWeek;
    }).map((appointment: any) => ({
      id: appointment.id,
      start: appointment.startDateTime,
      end: DateTime.fromISO(appointment.startDateTime).plus({ minutes: appointment.durationMin }).toISO()!,
      title: appointment.title,
      clientId: appointment.clientId,
      status: appointment.status,
      startedAt: appointment.startedAt,
      completedAt: appointment.completedAt,
      actualDurationMin: appointment.actualDurationMin,
      serviceId: appointment.serviceId,
      assignedTo: appointment.assignedTo,
    }));
  }, [appointments, ref]);

  const days = useMemo(() => {
    const start = ref.startOf('week');
    return Array.from({ length: DAY_COLS }, (_, i) => start.plus({ days: i }));
  }, [ref]);

  const now = DateTime.now();
  const isThisWeek = ref.hasSame(now, 'week');
  const isPastWeek = ref.endOf('week') < now.startOf('week');
  const isFutureWeek = ref.startOf('week') > now.endOf('week');

  const groupedOccs = useMemo(() => groupOccurrencesByDayHour(items as Occ[]), [items]);

  // Lanes globales (empleados con al menos una cita en la semana)
  const globalLanes = useMemo(() => {
    const set = new Set<string>();
    (items as Occ[]).forEach((o) => {
      if (o.assignedTo && o.assignedTo !== 'unassigned') set.add(o.assignedTo);
    });
    return Array.from(set).sort();
  }, [items]);

  const employeeNameMap = useMemo(
    () => Object.fromEntries(userProfiles.map((p) => [p.id, p.name] as const)),
    [userProfiles]
  );
  const getEmployeeName = (id: string) => employeeNameMap[id] || `Usuario ${id.slice(0, 8)}`;

  const openEditor = (e: MouseEvent, data: EditTarget) => {
    e.stopPropagation();
    setEditing(data);
  };
  const handleFormSaved = () => onChanged?.();

  // Loading
  if (loading.core) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="w-72 h-10 bg-zinc-200 animate-pulse rounded-full" />
        <div className="w-48 h-10 bg-zinc-200 animate-pulse rounded-full" />
        </div>
        <div className="card p-4">
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-zinc-500">Cargando calendario...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (hasErrors) {
    return (
      <div className="space-y-3">
        <div className="card p-4">
          <div className="text-center py-16 text-red-500">
            <p className="mb-4">Error al cargar el calendario</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Navegación (con activos para pasada/futura) */}
        <nav
          aria-label="Navegación de semana"
          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white/70 p-0.5 shadow-sm backdrop-blur"
        >
          {(() => {
            const base =
              'px-3 py-1.5 rounded-full text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500';
            const ghost = 'hover:bg-zinc-100';
            const active = 'bg-sky-600 text-white shadow hover:bg-sky-500';
            return (
              <>
                <button
                  aria-label="Semana anterior"
                  onClick={() => setRef(ref.minus({ weeks: 1 }))}
                  className={`${base} ${isPastWeek ? active : ghost} min-w-[96px] text-left`}
                  title="Semana anterior"
                >
                  ‹ Semana
                </button>

                <button
                  onClick={() => setRef(DateTime.now())}
                  title="Ir a hoy"
                  className={`${base} ${isThisWeek ? active : ghost} font-medium px-4 min-w-[72px] text-center`}
                >
                  Hoy
                </button>

                <button
                  aria-label="Semana siguiente"
                  onClick={() => setRef(ref.plus({ weeks: 1 }))}
                  className={`${base} ${isFutureWeek ? active : ghost} min-w-[96px] text-right`}
                  title="Semana siguiente"
                >
                  Semana ›
                </button>
              </>
            );
          })()}
        </nav>

        {/* Rango + acciones + Empleados (siempre visible) */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-sm text-zinc-600">
            {ref.startOf('week').setLocale('es').toFormat('dd LLL')} – {ref.endOf('week').setLocale('es').toFormat('dd LLL yyyy')}
          </span>

          <button
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-sky-600 text-white hover:bg-sky-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            onClick={() => setOpenFormAt(nextQuarterISO(ref))}
            title="Agregar turno"
          >
            <span className="text-base leading-none">＋</span> Agregar turno
          </button>

          <div className="flex items-center gap-2">
            <button onClick={() => setScale((s) => Math.max(0.5, s - 0.1))} className="px-2 py-1 rounded bg-zinc-200" title="Reducir zoom">
              −
            </button>
            <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale((s) => Math.min(2, s + 0.1))} className="px-2 py-1 rounded bg-zinc-200" title="Aumentar zoom">
              ＋
            </button>
          </div>

          {/* Empleados: chips siempre visibles */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Empleados:</span>
            {loading.staff ? (
              <span className="text-xs text-zinc-400">Cargando…</span>
            ) : userProfiles.length === 0 ? (
              <span className="text-xs text-zinc-400">Sin empleados</span>
            ) : (
              userProfiles.map((u) => (
                <span key={u.id} className="px-2 py-0.5 rounded-full border border-zinc-200 text-xs" title={u.role}>
                  {u.name}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="card overflow-x-auto">
        <div
          className="origin-top-left"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left', minWidth: '960px' }}
        >
          <div className="grid isolate" style={{ gridTemplateColumns: `72px repeat(${DAY_COLS}, 1fr)` }}>
            {/* encabezado */}
            <div className="h-10" />
            {days.map((d, i) => (
              <div key={i} className="h-10 px-2 flex items-end justify-center text-sm font-medium border-b border-zinc-200">
                {fmtDay(d.toISO()!)}
              </div>
            ))}

            {/* filas */}
            {Array.from({ length: ((END_HOUR - START_HOUR) * 60) / SLOT_MIN }).map((_, row) => {
              const minute = (row * SLOT_MIN) % 60;
              const hour = Math.floor((row * SLOT_MIN) / 60) + START_HOUR;
              const label = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

              return (
                <Fragment key={`row-${row}`}>
                  {/* columna de horas */}
                  <div className="h-12 pr-2 text-xs text-right text-zinc-500 border-r border-zinc-200 flex items-center">
                    {label}
                  </div>

                  {days.map((d, di) => {
                    const dayKey = d.toFormat('yyyy-LL-dd');
                    const hourMinKey = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                    const isTodayCol = d.hasSame(now, 'day');

                    const startingHere = groupedOccs[dayKey]?.[hourMinKey] || [];

                    return (
                      <div
                        key={`${row}-${di}`}
                        className={`h-12 border border-l-0 border-t-0 border-zinc-200 relative overflow-visible ${
                          startingHere.length > 0 ? 'z-20' : 'z-0'
                        } ${isTodayCol ? 'bg-sky-50' : 'bg-white/40'} cursor-pointer`}
                        onClick={() => setOpenFormAt(slotISO(d, hour, minute))}
                        title="Click para nuevo turno"
                      >
                        {/* Citas ASIGNADAS: van por lanes por empleado */}
                        {startingHere
                          .filter((occ) => occ.assignedTo && occ.assignedTo !== 'unassigned')
                          .map((occ) => {
                            const start = DateTime.fromISO(occ.start);
                            const end = DateTime.fromISO(occ.end);
                            const mins = end.diff(start, 'minutes').minutes;
                            const rows = Math.max(1, Math.round(mins / SLOT_MIN));

                            const assignedTo = occ.assignedTo!;
                            const laneIndex = globalLanes.indexOf(assignedTo);
                            const laneCount = Math.max(1, globalLanes.length);
                            if (laneIndex === -1) return null;

                            const laneWidth = 100 / laneCount;
                            const leftPercent = laneIndex * laneWidth;

                            // Colores por empleado (solo para "pending")
                            const hue = hueFromId(assignedTo);
                            const empStyle =
                              occ.status === 'pending'
                                ? {
                                    backgroundColor: `hsl(${hue}, 60%, 85%)`,
                                    borderColor: `hsl(${hue}, 70%, 60%)`,
                                  }
                                : undefined;

                            // Estado -> overrides
                            let statusClasses =
                              'border-sky-400/60 text-zinc-900 shadow-sm rounded-lg';
                            if (occ.status === 'done') {
                              statusClasses =
                                'border-green-400 bg-green-200/50 text-green-800';
                            } else if (occ.status === 'cancelled') {
                              statusClasses =
                                'border-red-400 bg-red-200/50 text-red-800';
                            }

                            const employeeName = getEmployeeName(assignedTo);

                            return (
                              <div
                                key={occ.id}
                                onClick={(e) =>
                                  openEditor(e, {
                                    baseId: occ.id.split('::')[0],
                                    start: occ.start,
                                    end: occ.end,
                                    title: occ.title,
                                  })
                                }
                                className={`absolute top-0 z-20 text-left px-2 py-1 text-xs border ${statusClasses}`}
                                style={{
                                  height: `${rows * 3}rem`,
                                  width: `calc(${laneWidth}% - 4px)`,
                                  left: `calc(${leftPercent}% + 2px)`,
                                  ...empStyle,
                                }}
                                title={`${occ.title ?? 'Turno'} — ${employeeName}`}
                              >
                                <div className="space-y-1 h-full flex flex-col">
                                  <div className="font-medium line-clamp-1 text-[10px]">{occ.title ?? 'Turno'}</div>
                                  <div className="opacity-70 text-[9px]">
                                    {fmtTime(occ.start)}–{fmtTime(occ.end)}
                                  </div>
                                  <div className="text-[8px] opacity-60 truncate">{employeeName}</div>

                                  {rows > 2 && (
                                    <div className="mt-1 text-[8px] flex items-center gap-1">
                                      {occ.status === 'pending' && DateTime.fromISO(occ.end) < now && (
                                        <span className="px-1 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Vencido</span>
                                      )}
                                      {occ.status === 'done' && (
                                        <span className="px-1 py-0.5 rounded-full bg-green-100 text-green-700">
                                          ✓{typeof occ.actualDurationMin === 'number' ? ` ${occ.actualDurationMin}m` : ''}
                                        </span>
                                      )}
                                      {occ.status === 'cancelled' && (
                                        <span className="px-1 py-0.5 rounded-full bg-red-100 text-red-700">✗</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                        {/* Citas SIN asignar: chip pequeño en esquina */}
                        {startingHere
                          .filter((occ) => !occ.assignedTo || occ.assignedTo === 'unassigned')
                          .map((occ, idx) => {
                            const start = DateTime.fromISO(occ.start);
                            const end = DateTime.fromISO(occ.end);
                            const mins = end.diff(start, 'minutes').minutes;
                            const rows = Math.max(1, Math.round(mins / SLOT_MIN));
                            return (
                              <div
                                key={occ.id}
                                onClick={(e) =>
                                  openEditor(e, {
                                    baseId: occ.id.split('::')[0],
                                    start: occ.start,
                                    end: occ.end,
                                    title: occ.title,
                                  })
                                }
                                className="absolute top-0 right-0 z-30 text-left rounded-md px-1 py-0.5 text-[9px] border
                                           border-gray-400 bg-gray-200/80 text-gray-800
                                           cursor-pointer opacity-75 hover:opacity-100"
                                style={{
                                  height: `${Math.min(rows * 3, 2)}rem`,
                                  width: '30px',
                                  top: `${idx * 0.5}rem`,
                                }}
                                title={`${occ.title ?? 'Turno'} — Sin asignar`}
                              >
                                <div className="text-[8px] font-medium truncate">{occ.title?.slice(0, 4) ?? 'Turn'}</div>
                                <div className="text-[7px] opacity-70">Sin asig.</div>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Crear */}
      {openFormAt && (
        <AppointmentForm
          defaultStart={openFormAt}
          onClose={() => setOpenFormAt(undefined)}
          onSaved={() => {
            setOpenFormAt(undefined);
            handleFormSaved();
          }}
        />
      )}

      {/* Editar */}
      {editing && (
        <AppointmentForm
          defaultStart={editing.start}
          editingBaseId={editing.baseId}
          occurrenceStartISO={editing.start}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            handleFormSaved();
          }}
        />
      )}
    </div>
  );
}
