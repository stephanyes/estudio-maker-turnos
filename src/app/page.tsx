'use client';
import WeekView from './components/WeekView';
import WeekViewRBC from './components/WeekView2'; // Importar nueva vista
import WeekView3 from './components/WeekView3'; // Vista móvil estilo Google Calendar
import WeekView4 from './components/WeekView4'; // Vista desktop estilo Google Calendar
import { useIsMobile } from '@/hooks/useIsMobile';
import { exportJSON, importJSON } from '@/lib/backup';
import { saveAs } from 'file-saver';
import { useRef, useState, useEffect } from 'react';
import { resetSupabaseTenant } from '@/lib/reset-db';
import StatsBar from './components/StatsBar';
import StatsView  from './components/StatsView';
import DevTools from './components/DevTools';

// import ThemeToggle from './components/ThemeToggle'; 
import ClientsView from './components/ClientsView';
import FollowUpView from './components/FollowUpView';
import DailyRevenueView from './components/DailyRevenueView';
import TrafficView from './components/TrafficView';
import StaffManagementView from './components/StaffManagementView';
import TimeMetricsView from './components/TimeMetricsView';
import AdminDashboard from './components/AdminDashboard';
import CompetitorsView from './components/CompetitorsView';
import { ProtectedRoute } from './components/Auth/LoginForm';
import { usePermissions, useAuth } from './context/AuthContext';
import { useData } from './context/DataProvider';
import Logo from './components/Logo';

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

type View = 'week' | 'stats' | 'clients' | 'followup' | 'daily' | 'traffic' | 'staff' | 'timing' | 'dev' | 'admin' | 'competitors';

export default function Home() {
  const [view, setView] = useState<View>('week');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const permissions = usePermissions();
  const { signOut, user } = useAuth();
  const { userProfiles } = useData();
  
  // Obtener el perfil del usuario actual
  const userProfile = userProfiles?.find(profile => profile.id === user?.id);
  const isMobile = useIsMobile();
  
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
  const handleCompetitors = () => setView('competitors');

  return (
    <ProtectedRoute>
      <main className="space-y-4">
        {/* Header */}
        <div className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* Mobile Menu Button */}
          <div className="flex items-center justify-between md:hidden">
            {/* Logo izquierda - Clickable para ir a agenda */}
            <button
              onClick={() => setView('week')}
              className="focus:outline-none"
            >
              <img 
                src="/assets/imgs/logo.PNG" 
                alt="Logo" 
                className="w-16 h-16 object-contain hover:opacity-80 transition-opacity"
              />
            </button>
            
            {/* Texto centro */}
            <img 
              src="/assets/imgs/estudio_maker_black.PNG" 
              alt="Estudio Maker" 
              className="h-14 object-contain"
            />
            
            {/* Hamburger menu derecha - centrado verticalmente */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors flex items-center justify-center"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

                    {/* Desktop Navigation */}
          <div className="hidden md:flex w-full">
            <nav
              aria-label="Acciones"
              className="flex items-center w-full
                        rounded-xl border border-zinc-200
                        bg-white/70 p-2 shadow-sm backdrop-blur
                        min-w-0"
            >
              {/* Vistas principales */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  onClick={handleWeek}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                            hover:bg-zinc-100
                            ${view === 'week' ? 'bg-sky-100 text-sky-700' : ''}`}
                >
                  <CalendarDays size={16} />
                  <span className="hidden 2xl:inline">Agenda</span>
                </button>

                <button
                  onClick={handleDaily}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                            hover:bg-zinc-100
                            ${view === 'daily' ? 'bg-green-100 text-green-700' : ''}`}
                  title="Agenda del día con pagos"
                >
                  <Receipt size={16} />
                  <span className="hidden 2xl:inline">Día</span>
                </button>

                <button
                  onClick={handleClients}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                            hover:bg-zinc-100
                            ${view === 'clients' ? 'bg-blue-100 text-blue-700' : ''}`}
                >
                  <Users size={16} />
                  <span className="hidden xl:inline">Clientes</span>
                </button>

                <button
                  onClick={handleFollowUp}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                            hover:bg-zinc-100
                            ${view === 'followup' ? 'bg-orange-100 text-orange-700' : ''}`}
                  title="Clientes que necesitan seguimiento"
                >
                  <AlertTriangle size={16} />
                  <span className="hidden xl:inline">Seguimiento</span>
                </button>

                {/* Vista de tráfico - Solo Admin */}
                {permissions.canViewTraffic && (
                  <button
                    onClick={handleTraffic}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                              hover:bg-zinc-100
                              ${view === 'traffic' ? 'bg-purple-100 text-purple-700' : ''}`}
                    title="Estadísticas de tráfico de personas"
                  >
                    <TrendingUp size={16} />
                    <span className="hidden lg:inline">Tráfico</span>
                  </button>
                )}
                
                {/* Competencia - Solo Admin */}
                {permissions.canViewCompetitors && (
                  <button
                    onClick={handleCompetitors}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                              hover:bg-zinc-100
                              ${view === 'competitors' ? 'bg-emerald-100 text-emerald-700' : ''}`}
                    title="Precios de la competencia"
                  >
                    <TrendingUp size={16} />
                    <span className="hidden lg:inline">Competencia</span>
                  </button>
                )}
                
                {/* Estadísticas - Solo Admin */}
                {permissions.canViewStats && (
                  <button
                    onClick={handleStats}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                              hover:bg-zinc-100
                              ${view === 'stats' ? 'bg-sky-100 text-sky-700' : ''}`}
                  >
                    <BarChart3 size={16} />
                    <span className="hidden lg:inline">Estadísticas</span>
                  </button>
                )}

                {/* Gestión de empleados - Solo Admin */}
                {permissions.canManageStaff && (
                <button
                  onClick={handleStaff}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                            hover:bg-zinc-100
                            ${view === 'staff' ? 'bg-teal-100 text-teal-700' : ''}`}
                  title="Gestión de empleados y horarios"
                >
                  <UserCheck size={16} />
                  <span className="hidden lg:inline">Empleados</span>
                </button>
                )}

                <button
                  onClick={handleTiming}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                            hover:bg-zinc-100
                            ${view === 'timing' ? 'bg-indigo-100 text-indigo-700' : ''}`}
                  title="Métricas de tiempo y productividad"
                >
                  <Timer size={16} />
                  <span className="hidden lg:inline">Tiempo</span>
                </button>
                
                <button
                  onClick={handleDev}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                            hover:bg-zinc-100
                            ${view === 'dev' ? 'bg-amber-100 text-amber-700' : ''}
                            border border-amber-300`}
                  title="Herramientas de desarrollo"
                >
                  <Settings size={16} />
                  <span className="hidden lg:inline">Dev</span>
                </button>
              </div>

              {/* Separador visual */}
              <div className="w-px h-6 bg-zinc-200 mx-2 flex-shrink-0" />

              {/* Controles de usuario */}
              <div className="flex items-center gap-1 min-w-0">
                {/* Dashboard de Administración - Solo Admin */}
                {permissions.canAccessAdmin && (
                  <button
                    onClick={handleAdmin}
                    className={`inline-flex items-center gap-1 px-1.5 py-1.5 rounded-full text-sm
                              hover:bg-zinc-100
                              ${view === 'admin' ? 'bg-purple-100 text-purple-700' : ''}
                              border border-purple-200
                              whitespace-nowrap`}
                    title="Panel de administración"
                  >
                    <Shield size={14} />
                    <span className="hidden xl:inline">Admin</span>
                  </button>
                )}

                {/* Indicador de rol */}
                {permissions.role && (
                  <div className="px-1 py-1 rounded-full text-xs font-medium
                                 bg-blue-100 text-blue-700
                                 border border-blue-200
                                 whitespace-nowrap">
                    {permissions.role === 'admin' ? '👑' : '👥'}
                    <span className="hidden xl:inline ml-1">
                      {permissions.role === 'admin' ? 'Admin' : 'Staff'}
                    </span>
                  </div>
                )}
                
                {/* Botón de Logout */}
                <button
                  onClick={signOut}
                  className="inline-flex items-center gap-1 px-1.5 py-1.5 rounded-full text-sm
                            border border-red-300
                            text-red-700
                            bg-red-50/80
                            hover:bg-red-100
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300
                            transition-colors
                            whitespace-nowrap"
                >
                  <LogOut size={14} />
                  <span className="hidden xl:inline">Cerrar Sesión</span>
                </button>
              </div>
            </nav>
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

                    {permissions.canViewCompetitors && (
                      <button
                        onClick={() => { handleCompetitors(); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                          view === 'competitors' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-zinc-50'
                        }`}
                      >
                        <BarChart3 size={16} />
                        <span>Competencia</span>
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
            <div className="card">
            {/* <WeekViewRBC onChanged={() => {
                // console.log('🎯 page.tsx: onChanged called (week view) - this should NOT cause a reload');
              }} /> */}
                          {isMobile ? (
              <WeekView3 onChanged={() => {
                // console.log('🎯 page.tsx: onChanged called (week view mobile) - this should NOT cause a reload');
              }} />
            ) : (
              <WeekView4 onChanged={() => {
                // console.log('🎯 page.tsx: onChanged called (week view desktop) - this should NOT cause a reload');
              }} />
            )}
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

        {/* Vista de Competencia - Solo Admin */}
        {view === 'competitors' && permissions.canViewCompetitors && (
          <div className="card p-4">
            <CompetitorsView />
          </div>
        )}

        {/* Dashboard de Administración - Solo Admin */}
        {view === 'admin' && permissions.canAccessAdmin && (
          <div className="card p-4">
            <AdminDashboard 
              onExport={handleExport}
              onImport={() => document.getElementById('import-json-admin')?.click()}
              onReset={handleReset}
              canExportData={permissions.canExportData}
              canImportData={permissions.canImportData}
              canResetData={permissions.canResetData}
            />
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}