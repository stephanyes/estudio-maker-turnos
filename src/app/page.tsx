'use client';
import WeekView from './components/WeekView';
import WeekViewRBC from './components/WeekView2'; // Importar nueva vista
import { exportJSON, importJSON } from '@/lib/backup';
import { saveAs } from 'file-saver';
import { useRef, useState } from 'react';
import { resetSupabaseTenant } from '@/lib/reset-db';
import StatsBar from './components/StatsBar';
import StatsView  from './components/StatsView';
import DevTools from './components/DevTools';
import PricesView from './components/PriceView';
// import ThemeToggle from './components/ThemeToggle'; 
import ClientsView from './components/ClientsView';
import FollowUpView from './components/FollowUpView';
import DailyRevenueView from './components/DailyRevenueView';
import TrafficView from './components/TrafficView';
import StaffManagementView from './components/StaffManagementView';
import TimeMetricsView from './components/TimeMetricsView';
import AdminDashboard from './components/AdminDashboard';
import { ProtectedRoute } from './components/Auth/LoginForm';
import { usePermissions, useAuth } from './context/AuthContext';

import { 
  Download, 
  Upload, 
  Trash2, 
  CalendarDays, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Users, 
  AlertTriangle,
  Receipt,
  TrendingUp,
  UserCheck,
  Timer,
  Calendar,
  LogOut,
  Menu,
  X,
  Shield
} from "lucide-react";

type View = 'week' | 'prices' | 'stats' | 'clients' | 'followup' | 'daily' | 'traffic' | 'staff' | 'timing' | 'dev' | 'admin';

export default function Home() {
  const [view, setView] = useState<View>('week');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const permissions = usePermissions();
  const { signOut, user, userProfile } = useAuth();
  
        // Debug removido para optimización

  async function handleExport() {
    const data = await exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `turnos-backup-${new Date().toISOString().slice(0, 10)}.json`);
  }
  
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const txt = await f.text();
    await importJSON(JSON.parse(txt));
    window.location.reload();
  }
  
  async function handleReset() {
    if (!confirm('Esto borra TODOS los turnos y datos locales. ¿Continuar?')) return;
    await resetSupabaseTenant();
  }

  const handlePrices = () => setView('prices');
  const handleStats = () => setView('stats');
  const handleWeek = () => setView('week');

  const handleDev = () => setView('dev');
  const handleClients = () => setView('clients');
  const handleFollowUp = () => setView('followup');
  const handleDaily = () => setView('daily');
  const handleTraffic = () => setView('traffic');
  const handleStaff = () => setView('staff');
  const handleTiming = () => setView('timing');
  const handleAdmin = () => setView('admin');

  return (
    <ProtectedRoute>
      <main className="space-y-4">
        {/* Header */}
        <div className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Mobile Menu Button */}
          <div className="flex items-center justify-between md:hidden px-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
                              <h1 className="text-xl font-bold text-zinc-900">Estudio Maker</h1>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full">
            <nav
              aria-label="Acciones"
              className="flex flex-wrap gap-2 w-full sm:w-auto
                        rounded-xl border border-zinc-200
                        bg-white/70 p-2 shadow-sm backdrop-blur"
            >
              {/* Exportar - Solo Admin */}
              {permissions.canExportData && (
              <button
                onClick={handleExport}
                className="flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                            hover:bg-zinc-100
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                title="Exportar a JSON"
              >
                <Download size={16} />
                <span>Exportar</span>
              </button>
              )}

              {/* Importar - Solo Admin */}
              {permissions.canImportData && (
              <label
                htmlFor="import-json"
                className="flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm cursor-pointer
                            hover:bg-zinc-100
                          focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500"
                title="Importar desde JSON"
              >
                <Upload size={16} />
                <span>Importar</span>
              </label>
              )}

              {/* Reiniciar - Solo Admin */}
              {permissions.canResetData && (
              <button
                onClick={handleReset}
                className="flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                            border border-red-300
                            text-red-700
                            bg-red-50/80
                            hover:bg-red-100
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300
                          shadow-none"
                title="Borrar base local"
              >
                <Trash2 size={16} />
                <span>Reiniciar</span>
              </button>
              )}

              {/* Separador visual */}
              <div className="w-px h-6 bg-zinc-200 mx-1 hidden sm:block" />

              {/* Vistas principales */}
              <button
                onClick={handleWeek}
                className={`flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                          hover:bg-zinc-100
                          ${view === 'week' ? 'bg-sky-100 text-sky-700' : ''}`}
              >
                <CalendarDays size={16} />
                <span>Agenda</span>
              </button>

              <button
                onClick={handleDaily}
                className={`flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                          hover:bg-zinc-100
                          ${view === 'daily' ? 'bg-green-100 text-green-700' : ''}`}
                title="Agenda del día con pagos"
              >
                <Receipt size={16} />
                <span>Día</span>
              </button>

              <button
                onClick={handleClients}
                className={`flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                          hover:bg-zinc-100
                          ${view === 'clients' ? 'bg-blue-100 text-blue-700' : ''}`}
              >
                <Users size={16} />
                <span>Clientes</span>
              </button>

              <button
                onClick={handleFollowUp}
                className={`flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                          hover:bg-zinc-100
                          ${view === 'followup' ? 'bg-orange-100 text-orange-700' : ''}`}
                title="Clientes que necesitan seguimiento"
              >
                <AlertTriangle size={16} />
                <span>Seguimiento</span>
              </button>

              {/* Vista de tráfico - Solo Admin */}
              {permissions.canViewTraffic && (
                <button
                  onClick={handleTraffic}
                  className={`flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                            hover:bg-zinc-100
                            ${view === 'traffic' ? 'bg-purple-100 text-purple-700' : ''}`}
                  title="Estadísticas de tráfico de personas"
                >
                  <TrendingUp size={16} />
                  <span>Tráfico</span>
                </button>
              )}
              
              {/* Precios - Solo Admin */}
              {permissions.canManagePrices && (
                <button
                  onClick={handlePrices}
                  className={`flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                            hover:bg-zinc-100
                            ${view === 'prices' ? 'bg-sky-100 text-sky-700' : ''}`}
                >
                  <DollarSign size={16} />
                  <span>Precios</span>
                </button>
              )}
              
              {/* Estadísticas - Solo Admin */}
              {permissions.canViewStats && (
                <button
                  onClick={handleStats}
                  className={`flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                            hover:bg-zinc-100
                            ${view === 'stats' ? 'bg-sky-100 text-sky-700' : ''}`}
                >
                  <BarChart3 size={16} />
                  <span>Estadísticas</span>
                </button>
              )}

              {/* Gestión de empleados - Solo Admin */}
              {permissions.canManageStaff && (
              <button
                onClick={handleStaff}
                className={`flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                            hover:bg-zinc-100
                            ${view === 'staff' ? 'bg-teal-100 text-teal-700' : ''}`}
                title="Gestión de empleados y horarios"
              >
                <UserCheck size={16} />
                <span>Empleados</span>
              </button>
              )}

              <button
                onClick={handleTiming}
                className={`flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                          hover:bg-zinc-100
                          ${view === 'timing' ? 'bg-indigo-100 text-indigo-700' : ''}`}
                title="Métricas de tiempo y productividad"
              >
                <Timer size={16} />
                <span>Tiempo</span>
              </button>
              
                <button
                  onClick={handleDev}
                  className={`flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                          hover:bg-zinc-100
                          ${view === 'dev' ? 'bg-amber-100 text-amber-700' : ''}
                          border border-amber-300`}
                  title="Herramientas de desarrollo"
                >
                  <Settings size={16} />
                  <span>Dev</span>
                </button>

                {/* Dashboard de Administración - Solo Admin */}
                {permissions.canAccessAdmin && (
                  <button
                    onClick={handleAdmin}
                    className={`flex-1 sm:flex-none inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                            hover:bg-zinc-100
                            ${view === 'admin' ? 'bg-purple-100 text-purple-700' : ''}
                            border border-purple-200`}
                    title="Panel de administración"
                  >
                    <Shield size={16} />
                    <span>Admin</span>
                  </button>
                )}
            </nav>

            <div className="sm:ml-auto flex items-center gap-2">
              {/* Indicador de rol */}
              {permissions.role && (
                <div className="px-2 py-1 rounded-full text-xs font-medium
                               bg-blue-100 text-blue-700
                               border border-blue-200">
                  {permissions.role === 'admin' ? '👑 Admin' : '👥 Staff'}
                </div>
              )}
              
              {/* Botón de Logout */}
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                          border border-red-300
                          text-red-700
                          bg-red-50/80
                          hover:bg-red-100
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300
                          transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-lg space-y-3">
              {/* Herramientas Admin */}
              {(permissions.canExportData || permissions.canImportData || permissions.canResetData) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-700 border-b border-zinc-100 pb-1">Herramientas</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {permissions.canExportData && (
                      <button
                        onClick={handleExport}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-zinc-50"
                      >
                        <Download size={16} />
                        <span>Exportar</span>
                      </button>
                    )}
                    {permissions.canImportData && (
                      <label
                        htmlFor="import-json"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-zinc-50 cursor-pointer"
                      >
                        <Upload size={16} />
                        <span>Importar</span>
                      </label>
                    )}
                    {permissions.canResetData && (
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-red-50 text-red-700"
                      >
                        <Trash2 size={16} />
                        <span>Reiniciar</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Navegación Principal */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-zinc-700 border-b border-zinc-100 pb-1">Navegación</h3>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => { handleWeek(); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      view === 'week' ? 'bg-sky-100 text-sky-700' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <CalendarDays size={16} />
                    <span>Agenda</span>
                  </button>
                  <button
                    onClick={() => { handleDaily(); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      view === 'daily' ? 'bg-green-100 text-green-700' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <Receipt size={16} />
                    <span>Día</span>
                  </button>
                  <button
                    onClick={() => { handleClients(); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      view === 'clients' ? 'bg-blue-100 text-blue-700' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <Users size={16} />
                    <span>Clientes</span>
                  </button>
                  <button
                    onClick={() => { handleFollowUp(); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      view === 'followup' ? 'bg-orange-100 text-orange-700' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <AlertTriangle size={16} />
                    <span>Seguimiento</span>
                  </button>
                </div>
              </div>

              {/* Herramientas Admin */}
              {(permissions.canViewTraffic || permissions.canManagePrices || permissions.canViewStats || permissions.canManageStaff || permissions.canAccessAdmin) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-700 border-b border-zinc-100 pb-1">Admin</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {permissions.canViewTraffic && (
                      <button
                        onClick={() => { handleTraffic(); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                          view === 'traffic' ? 'bg-purple-100 text-purple-700' : 'hover:bg-zinc-50'
                        }`}
                      >
                        <TrendingUp size={16} />
                        <span>Tráfico</span>
                      </button>
                    )}
                    {permissions.canManagePrices && (
                      <button
                        onClick={() => { handlePrices(); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                          view === 'prices' ? 'bg-sky-100 text-sky-700' : 'hover:bg-zinc-50'
                        }`}
                      >
                        <DollarSign size={16} />
                        <span>Precios</span>
                      </button>
                    )}
                    {permissions.canViewStats && (
                      <button
                        onClick={() => { handleStats(); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                          view === 'stats' ? 'bg-sky-100 text-sky-700' : 'hover:bg-zinc-50'
                        }`}
                      >
                        <BarChart3 size={16} />
                        <span>Estadísticas</span>
                      </button>
                    )}
                    {permissions.canManageStaff && (
                      <button
                        onClick={() => { handleStaff(); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                          view === 'staff' ? 'bg-teal-100 text-teal-700' : 'hover:bg-zinc-50'
                        }`}
                      >
                        <UserCheck size={16} />
                        <span>Empleados</span>
                      </button>
                    )}
                    <button
                      onClick={() => { handleTiming(); setMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                        view === 'timing' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-zinc-50'
                      }`}
                    >
                      <Timer size={16} />
                      <span>Tiempo</span>
                    </button>
                    <button
                      onClick={() => { handleDev(); setMobileMenuOpen(false); }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                        view === 'dev' ? 'bg-amber-100 text-amber-700' : 'hover:bg-zinc-50'
                      }`}
                    >
                      <Settings size={16} />
                      <span>Dev</span>
                    </button>
                    {permissions.canAccessAdmin && (
                      <button
                        onClick={() => { handleAdmin(); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                          view === 'admin' ? 'bg-purple-100 text-purple-700' : 'hover:bg-zinc-50'
                        } border border-purple-200`}
                      >
                        <Shield size={16} />
                        <span>Panel Admin</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Usuario y Logout */}
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  {permissions.role && (
                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                      {permissions.role === 'admin' ? '👑 Admin' : '👥 Staff'}
                    </div>
                  )}
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                  >
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input de archivo oculto */}
            <input
              id="import-json"
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImport}
            />

        {/* Contenido principal */}
        {view === 'week' && (
          <>
            <StatsBar />
            <div className="card p-4">
              <WeekViewRBC onChanged={() => {
                // console.log('🎯 page.tsx: onChanged called (week view) - this should NOT cause a reload');
              }} />
            </div>
          </>
        )}
        

        
        {/* Vista de agenda diaria con pagos */}
        {view === 'daily' && (
          <div className="card p-4">
            <DailyRevenueView />
          </div>
        )}
        
        {/* Vista de tráfico de personas - Solo Admin */}
        {view === 'traffic' && permissions.canViewTraffic && (
          <div className="card p-4">
            <TrafficView />
          </div>
        )}
        
        {view === 'prices' && permissions.canManagePrices && (
          <div className="card p-4">
            <PricesView />
          </div>
        )}
        {view === 'stats' && permissions.canViewStats && (
          <div className="card p-4">
            <StatsView />
          </div>
        )}
        {view === 'dev' && permissions.canAccessDev && (
          <div className="card p-4">
            <DevTools />
          </div>
        )}
        {view === 'clients' && (
          <div className="card p-4">
            <ClientsView />
          </div>
        )}
        {view === 'followup' && (
          <div className="card p-4">
            <FollowUpView />
          </div>
        )}

        {/* Vista de gestión de empleados - Solo Admin */}
        {view === 'staff' && permissions.canManageStaff && (
          <div className="card p-4">
            <StaffManagementView />
          </div>
        )}

        {/* Vista de métricas de tiempo - Solo Admin */}
        {view === 'timing' && permissions.canViewTiming && (
          <div className="card p-4">
            <TimeMetricsView />
          </div>
        )}

        {/* Dashboard de Administración - Solo Admin */}
        {view === 'admin' && permissions.canAccessAdmin && (
          <div className="card p-4">
            <AdminDashboard />
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}