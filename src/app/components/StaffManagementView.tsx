'use client';
import { useState } from 'react';
import { 
  useCreateStaffSchedule, 
  useUpdateStaffSchedule, 
  useDeleteStaffSchedule
} from '@/lib/queries';
import { useData } from '@/app/context/DataProvider';
import { useAuth } from '@/app/context/AuthContext';
import { StaffSchedule, UserProfile } from '@/lib/supabase-db';
import { Users, Clock, Plus, Edit3, Trash2, Calendar, UserCheck, UserX, RotateCcw } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function StaffManagementView() {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<StaffSchedule | null>(null);
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);

  // 🎯 DataProvider para obtener todos los datos
  const { staffSchedules: schedules, userProfiles, loading  } = useData();
  const { reactivateUser } = useAuth();

  const createScheduleMutation = useCreateStaffSchedule();
  const updateScheduleMutation = useUpdateStaffSchedule();
  const deleteScheduleMutation = useDeleteStaffSchedule();

  // Debug: verificar qué datos están llegando
      // console.log('🔍 StaffManagementView - userProfile:', userProfile);
    // console.log('🔍 StaffManagementView - userProfile[0]:', userProfile[0]);

  // Separar empleados activos y eliminados
  const activeEmployees = userProfiles?.filter(emp => emp.status === 'active') || [];
  const deletedEmployees = userProfiles?.filter(emp => emp.status === 'deleted') || [];

      // console.log('🔍 StaffManagementView - activeEmployees:', activeEmployees);
    // console.log('🔍 StaffManagementView - deletedEmployees:', deletedEmployees);

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

  const handleReactivateUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de que quieres reactivar a ${userName}?`)) {
      return;
    }

    try {
      const { error } = await reactivateUser(userId);
      if (error) {
        alert(`Error al reactivar usuario: ${error.message}`);
      } else {
        alert('Usuario reactivado exitosamente');
        // Recargar datos
        window.location.reload();
      }
    } catch (error) {
      alert('Error inesperado al reactivar usuario');
    }
  };

  if (loading.staff) {
    return (
      <LoadingSpinner 
        message="Cargando empleados..." 
        variant="black"
        size="large"
      />
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

      {/* Empleados Activos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Empleados Activos ({activeEmployees.length})
          </h2>
        </div>

        <div className="grid gap-4">
          {activeEmployees.map(employee => {
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
                {employeeSchedules.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Horarios configurados:
                    </h4>
                    <div className="grid gap-2">
                      {employeeSchedules.map(schedule => (
                        <div 
                          key={schedule.id}
                          className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-zinc-500" />
                            <span className="text-sm font-medium">
                              {days.find(d => d.value === schedule.dayOfWeek)?.name}
                            </span>
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                              {schedule.startTime} - {schedule.endTime}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingSchedule(schedule);
                                setShowScheduleForm(true);
                              }}
                              className="p-1 text-zinc-600 hover:text-sky-600"
                              title="Editar horario"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                              className="p-1 text-zinc-600 hover:text-red-600"
                              title="Eliminar horario"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Empleados Eliminados */}
      {deletedEmployees.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                Empleados Eliminados ({deletedEmployees.length})
              </h2>
            </div>
            
            <button
              onClick={() => setShowDeletedUsers(!showDeletedUsers)}
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {showDeletedUsers ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showDeletedUsers && (
            <div className="grid gap-4">
              {deletedEmployees.map(employee => {
                const employeeSchedules = getUserSchedules(employee.id);
                
                return (
                  <div 
                    key={employee.id}
                    className="bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800 p-6 opacity-75"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 line-through">
                          {employee.name}
                        </h3>
                        <p className="text-sm text-zinc-500 capitalize">{employee.role}</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Usuario eliminado
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-500">
                          {employeeSchedules.length} horarios
                        </span>
                        <button
                          onClick={() => handleReactivateUser(employee.id, employee.name)}
                          className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg"
                          title="Reactivar usuario"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Horarios del empleado eliminado */}
                    {employeeSchedules.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Horarios (se preservarán al reactivar):
                        </h4>
                        <div className="grid gap-2">
                          {employeeSchedules.map(schedule => (
                            <div 
                              key={schedule.id}
                              className="flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-700/30 rounded-lg opacity-75"
                            >
                              <Calendar className="w-4 h-4 text-zinc-500" />
                              <span className="text-sm font-medium">
                                {days.find(d => d.value === schedule.dayOfWeek)?.name}
                              </span>
                              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                {schedule.startTime} - {schedule.endTime}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de formulario de horarios */}
      {showScheduleForm && (
        <ScheduleFormModal
          userId={selectedUserId || editingSchedule?.userId || ''}
          editingSchedule={editingSchedule}
          employees={activeEmployees} // Solo mostrar empleados activos
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