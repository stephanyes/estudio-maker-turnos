'use client';
import { useState } from 'react';
import { 
  useCreateStaffSchedule, 
  useUpdateStaffSchedule, 
  useDeleteStaffSchedule 
} from '@/lib/queries';
import { useData } from '@/app/context/DataProvider';
import { StaffSchedule } from '@/lib/supabase-db';
import { Users, Clock, Plus, Edit3, Trash2, Calendar } from 'lucide-react';

export default function StaffManagementView() {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<StaffSchedule | null>(null);

  // 🎯 DataProvider para obtener todos los datos
  const { userProfiles, staffSchedules: schedules, loading } = useData();

  const createScheduleMutation = useCreateStaffSchedule();
  const updateScheduleMutation = useUpdateStaffSchedule();
  const deleteScheduleMutation = useDeleteStaffSchedule();

  const days = [
    { name: 'Domingo', value: 0 },
    { name: 'Lunes', value: 1 },
    { name: 'Martes', value: 2 },
    { name: 'Miércoles', value: 3 },
    { name: 'Jueves', value: 4 },
    { name: 'Viernes', value: 5 },
    { name: 'Sábado', value: 6 },
  ];

  const getUserSchedules = (userId: string) => {
    return schedules.filter(s => s.userId === userId);
  };

  if (loading.staff) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="animate-spin w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full flex-shrink-0"></div>
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">Cargando empleados...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-sky-600" />
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Gestión de Empleados
          </h1>
        </div>

        <button
          onClick={() => setShowScheduleForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500"
        >
          <Plus className="w-4 h-4" />
          Agregar Horario
        </button>
      </div>

      {/* Lista de empleados */}
      <div className="grid gap-6">
        {userProfiles.map(employee => {
          const employeeSchedules = getUserSchedules(employee.id);
          
          return (
            <div 
              key={employee.id}
              className="bg-white dark:bg-neutral-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {employee.name}
                  </h3>
                  <p className="text-sm text-zinc-500 capitalize">{employee.role}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500">
                    {employeeSchedules.length} horarios
                  </span>
                  <button
                    onClick={() => {
                      setSelectedUserId(employee.id);
                      setShowScheduleForm(true);
                    }}
                    className="p-2 text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-900/20 rounded-lg"
                    title="Agregar horario"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Horarios del empleado */}
              <div className="space-y-3">
                {employeeSchedules.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p>No hay horarios configurados</p>
                    <p className="text-sm">Agrega horarios de trabajo para este empleado</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {employeeSchedules.map(schedule => {
                      const dayName = days.find(d => d.value === schedule.dayOfWeek)?.name;
                      
                      return (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-neutral-700 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-zinc-900 dark:text-zinc-100">
                              {dayName}
                            </div>
                            <div className="text-sm text-zinc-500 dark:text-zinc-400">
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingSchedule(schedule);
                                setShowScheduleForm(true);
                              }}
                              className="p-1 text-zinc-500 hover:text-sky-600"
                              title="Editar horario"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('¿Eliminar este horario?')) {
                                  deleteScheduleMutation.mutate(schedule.id);
                                }
                              }}
                              className="p-1 text-zinc-500 hover:text-red-600"
                              title="Eliminar horario"
                              disabled={deleteScheduleMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {userProfiles.length === 0 && (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No hay empleados registrados</p>
            <p className="text-sm">Los empleados se registran automáticamente cuando se crean usuarios</p>
          </div>
        )}
      </div>

      {/* Modal de formulario de horarios */}
      {showScheduleForm && (
        <ScheduleFormModal
          userId={selectedUserId || editingSchedule?.userId || ''}
          editingSchedule={editingSchedule}
          employees={userProfiles}
          onClose={() => {
            setShowScheduleForm(false);
            setSelectedUserId('');
            setEditingSchedule(null);
          }}
          onSave={(data) => {
            if (editingSchedule) {
              updateScheduleMutation.mutate({
                id: editingSchedule.id,
                changes: data
              });
            } else {
              createScheduleMutation.mutate(data);
            }
            setShowScheduleForm(false);
            setSelectedUserId('');
            setEditingSchedule(null);
          }}
        />
      )}
    </div>
  );
}

// Modal para crear/editar horarios
function ScheduleFormModal({ 
  userId, 
  editingSchedule, 
  employees,
  onClose, 
  onSave 
}: {
  userId: string;
  editingSchedule: StaffSchedule | null;
  employees: any[];
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState(editingSchedule?.userId || userId);
  const [dayOfWeek, setDayOfWeek] = useState(editingSchedule?.dayOfWeek ?? 1);
  const [startTime, setStartTime] = useState(editingSchedule?.startTime || '09:00');
  const [endTime, setEndTime] = useState(editingSchedule?.endTime || '18:00');

  const days = [
    { name: 'Domingo', value: 0 },
    { name: 'Lunes', value: 1 },
    { name: 'Martes', value: 2 },
    { name: 'Miércoles', value: 3 },
    { name: 'Jueves', value: 4 },
    { name: 'Viernes', value: 5 },
    { name: 'Sábado', value: 6 },
  ];

  const inputCls = 'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-neutral-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId || startTime >= endTime) {
      return;
    }

    onSave({
      userId: selectedUserId,
      dayOfWeek,
      startTime,
      endTime,
      isActive: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl"
      >
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-semibold">
              {editingSchedule ? 'Editar Horario' : 'Nuevo Horario'}
            </h2>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <label className="block">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Empleado</span>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className={inputCls}
              disabled={!!editingSchedule}
            >
              <option value="">Seleccionar empleado...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Día</span>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className={inputCls}
            >
              {days.map(day => (
                <option key={day.value} value={day.value}>
                  {day.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Hora inicio</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="block">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Hora fin</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputCls}
              />
            </label>
          </div>

          {startTime >= endTime && (
            <p className="text-sm text-red-600">
              La hora de fin debe ser posterior a la hora de inicio
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-neutral-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!selectedUserId || startTime >= endTime}
            className="px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingSchedule ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
}