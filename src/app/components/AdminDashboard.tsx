'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Shield, 
  User, 
  Calendar,
  Eye,
  EyeOff,
  Check,
  X,
  UserCheck,
  UserX,
  RotateCcw,
  Download,
  Upload
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface AdminDashboardProps {
  onExport?: () => void;
  onImport?: () => void;
  onReset?: () => void;
  canExportData?: boolean;
  canImportData?: boolean;
  canResetData?: boolean;
}

export default function AdminDashboard({ 
  onExport, 
  onImport, 
  onReset, 
  canExportData = false, 
  canImportData = false, 
  canResetData = false 
}: AdminDashboardProps) {
  const { createUserByAdmin, updateUserRole, deleteUser, getAllUsers, reactivateUser, user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'staff' as 'admin' | 'staff'
  });
  const [showPassword, setShowPassword] = useState(false);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await getAllUsers();
    
    if (error) {
      setError(error.message || 'Error al cargar usuarios');
    } else if (data) {
      setUsers(data);
    }
    setLoading(false);
  };

  // Separar usuarios activos y eliminados
  const activeUsers = users.filter(u => u.status === 'active');
  const deletedUsers = users.filter(u => u.status === 'deleted');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const { error } = await createUserByAdmin(
      formData.email,
      formData.password,
      formData.name,
      formData.role
    );

    if (error) {
      setError(error.message || 'Error al crear usuario');
    } else {
      setSuccess('Usuario creado exitosamente');
      setShowCreateForm(false);
      resetForm();
      loadUsers(); // Recargar lista
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'staff') => {
    setError(null);
    setSuccess(null);

    const { error } = await updateUserRole(userId, newRole);

    if (error) {
      setError(error.message || 'Error al actualizar rol');
    } else {
      setSuccess('Rol actualizado exitosamente');
      loadUsers(); // Recargar lista
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de que quieres desactivar a ${userName}? El usuario será marcado como eliminado pero sus citas se preservarán.`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    const { error } = await deleteUser(userId);

    if (error) {
      setError(error.message || 'Error al eliminar usuario');
    } else {
      setSuccess('Usuario desactivado exitosamente');
      loadUsers(); // Recargar lista
    }
  };

  const handleReactivateUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de que quieres reactivar a ${userName}?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    const { error } = await reactivateUser(userId);

    if (error) {
      setError(error.message || 'Error al reactivar usuario');
    } else {
      setSuccess('Usuario reactivado exitosamente');
      loadUsers(); // Recargar lista
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'staff'
    });
    setShowPassword(false);
  };

  const openEditForm = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      email: user.name, // Usar name como email temporal
      password: '',
      name: user.name,
      role: user.role
    });
  };

  const closeEditForm = () => {
    setEditingUser(null);
    resetForm();
  };

  if (loading) {
    return (
      <LoadingSpinner 
        message="Cargando usuarios..." 
        variant="black"
        size="large"
      />
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen p-4">
      {/* Header con tipografía moderna */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <div className="relative">
            <Shield className="w-8 h-8 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text tracking-wide">
              PANEL DE ADMINISTRACIÓN
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm tracking-wide">ESTUDIO + MAKER</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Botones de herramientas de datos */}
          <div className="flex gap-2">
            {/* Exportar - Solo Admin */}
            {canExportData && onExport && (
              <button
                onClick={onExport}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                          border border-green-300 text-green-700 bg-green-50/80
                          hover:bg-green-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                title="Exportar datos a JSON"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            )}

            {/* Importar - Solo Admin */}
            {canImportData && onImport && (
              <label
                htmlFor="import-json-admin"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer
                          border border-blue-300 text-blue-700 bg-blue-50/80
                          hover:bg-blue-100 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500"
                title="Importar datos desde JSON"
              >
                <Upload size={16} />
                <span className="hidden sm:inline">Importar</span>
              </label>
            )}

            {/* Reiniciar - Solo Admin */}
            {canResetData && onReset && (
              <button
                onClick={onReset}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                          border border-red-300 text-red-700 bg-red-50/80
                          hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                title="Borrar base de datos local"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Reiniciar</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg hover:from-purple-500 hover:to-cyan-500 transition-all duration-300 font-medium tracking-wide shadow-sm"
          >
            <UserPlus className="w-5 h-5" />
            <span className="hidden sm:inline">CREAR USUARIO</span>
            <span className="sm:hidden">CREAR</span>
          </button>
        </div>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            {success}
          </div>
        </div>
      )}

      {/* Usuarios Activos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Usuarios Activos ({activeUsers.length})
            </h2>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {activeUsers.map((userProfile) => (
            <div key={userProfile.id} className="px-4 md:px-6 py-4">
              <div className="flex flex-col gap-3">
                {/* Primera fila: Nombre y acciones */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {userProfile.role === 'admin' ? (
                      <Shield className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    ) : (
                      <User className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                    )}
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {userProfile.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Cambiar rol */}
                    {userProfile.id !== user?.id && (
                      <select
                        value={userProfile.role}
                        onChange={(e) => handleUpdateRole(userProfile.id, e.target.value as 'admin' | 'staff')}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="staff">STAFF</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    )}

                    {/* Editar usuario */}
                    <button
                      onClick={() => openEditForm(userProfile)}
                      className="p-2 text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-md transition-colors"
                      title="Editar usuario"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Eliminar usuario */}
                    {userProfile.id !== user?.id && (
                      <button
                        onClick={() => handleDeleteUser(userProfile.id, userProfile.name)}
                        className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Segunda fila: Información del usuario */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    userProfile.role === 'admin' 
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'
                  }`}>
                    {userProfile.role === 'admin' ? 'ADMIN' : 'STAFF'}
                  </span>
                  
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Creado: {new Date(userProfile.created_at).toLocaleDateString('es-AR')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usuarios Eliminados */}
      {deletedUsers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Usuarios Eliminados ({deletedUsers.length})
                </h2>
              </div>
              
              <button
                onClick={() => setShowDeletedUsers(!showDeletedUsers)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {showDeletedUsers ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {showDeletedUsers && (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {deletedUsers.map((userProfile) => (
                <div key={userProfile.id} className="px-4 md:px-6 py-4 opacity-75">
                  <div className="flex flex-col gap-3">
                    {/* Primera fila: Nombre y acciones */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {userProfile.role === 'admin' ? (
                          <Shield className="w-5 h-5 text-yellow-500/50 flex-shrink-0" />
                        ) : (
                          <User className="w-5 h-5 text-cyan-500/50 flex-shrink-0" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white line-through truncate">
                          {userProfile.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Reactivar usuario */}
                        <button
                          onClick={() => handleReactivateUser(userProfile.id, userProfile.name)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded-md transition-colors"
                          title="Reactivar usuario"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Segunda fila: Información del usuario */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userProfile.role === 'admin' 
                          ? 'bg-yellow-100/50 text-yellow-800/50 dark:bg-yellow-900/20 dark:text-yellow-300/50'
                          : 'bg-cyan-100/50 text-cyan-800/50 dark:bg-cyan-900/20 dark:text-cyan-300/50'
                      }`}>
                        {userProfile.role === 'admin' ? 'ADMIN' : 'STAFF'}
                      </span>
                      
                      <span className="text-xs text-red-500 dark:text-red-400">
                        Eliminado
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal para crear usuario */}
      {showCreateForm && (
        <CreateUserModal
          formData={formData}
          setFormData={setFormData}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          onSubmit={handleCreateUser}
          onClose={() => {
            setShowCreateForm(false);
            resetForm();
          }}
        />
      )}

      {/* Modal para editar usuario */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateUser} // Reutilizar la función de crear
          onClose={closeEditForm}
        />
      )}

      {/* Input file oculto para importación */}
      <input
        type="file"
        id="import-json-admin"
        accept=".json"
        style={{ display: 'none' }}
        onChange={(e) => {
          // Aquí se manejaría la importación si fuera necesario
          // Por ahora solo cerramos el input
          e.target.value = '';
        }}
      />
    </div>
  );
}

// Modal para crear usuario
function CreateUserModal({ 
  formData, 
  setFormData, 
  showPassword, 
  setShowPassword, 
  onSubmit, 
  onClose 
}: {
  formData: any;
  setFormData: (data: any) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  const inputCls = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-500 dark:placeholder-gray-400';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-cyan-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Crear Nuevo Usuario
            </h2>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Nombre completo</span>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputCls}
              placeholder="Nombre del usuario"
            />
          </label>

          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Email</span>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={inputCls}
              placeholder="usuario@email.com"
            />
          </label>

          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Contraseña</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`${inputCls} pr-10`}
                placeholder="••••••••"
                minLength={6}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Rol</span>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' })}
              className={inputCls}
            >
              <option value="staff">Staff (acceso limitado)</option>
              <option value="admin">Admin (acceso completo)</option>
            </select>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg hover:from-purple-500 hover:to-cyan-500 transition-colors font-medium shadow-sm"
            >
              Crear Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para editar usuario
function EditUserModal({ 
  user, 
  formData, 
  setFormData, 
  onSubmit, 
  onClose 
}: {
  user: UserProfile;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  const inputCls = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-500 dark:placeholder-gray-400';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-cyan-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Editar Usuario
            </h2>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Nombre completo</span>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputCls}
              placeholder="Nombre del usuario"
            />
          </label>

          <label className="block">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Rol</span>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' })}
              className={inputCls}
            >
              <option value="staff">Staff (acceso limitado)</option>
              <option value="admin">Admin (acceso completo)</option>
            </select>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg hover:from-purple-500 hover:to-cyan-500 transition-colors font-medium shadow-sm"
            >
              Actualizar Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
