'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { seedDatabase, verifySeedData, getQuickStats, addSeedData } from '../../lib/seed';
import { resetSupabaseTenant } from '../../lib/reset-db';
import { exportJSON, importJSON } from '../../lib/backup';
import { Database, Trash2, Download, Upload, BarChart3, Sprout, Plus } from 'lucide-react';
import { useData } from '@/app/context/DataProvider';
// import ThemeTest from './ThemeTest';

export default function DevTools() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  // 🎯 DataProvider para debugging
  const { 
    loading, 
    hasErrors, 
    errors, 
    isCoreDataReady,
    stats: contextStats,
    retry,
    canRetry 
  } = useData();

  const handleAction = async (action: () => Promise<void>, successMsg: string) => {
    setIsLoading(true);
    setMessage('');
    try {
      await action();
      setMessage(`✅ ${successMsg}`);
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeed = () => handleAction(seedDatabase, 'Datos de prueba sembrados correctamente');
  const handleAddSeed = () => handleAction(addSeedData, 'Datos de prueba agregados correctamente');

  const handleReset = () => {
    if (confirm('¿Estás seguro? Esto eliminará TODOS los datos.')) {
      handleAction(resetSupabaseTenant, 'Base de datos reseteada');
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const data = await exportJSON();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('✅ Backup exportado correctamente');
    } catch (error) {
      setMessage(`❌ Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const text = await file.text();
      const data = JSON.parse(text);
      await importJSON(data);
      setMessage('✅ Datos importados correctamente');
      event.target.value = ''; // resetear input
    } catch (error) {
      setMessage(`❌ Error al importar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStats = async () => {
    setIsLoading(true);
    try {
      const [verification, quickStats] = await Promise.all([
        verifySeedData(),
        getQuickStats()
      ]);
      setStats({ ...verification, ...quickStats });
      setMessage('✅ Estadísticas actualizadas');
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
          <Database className="w-6 h-6" />
          Herramientas de Desarrollo
        </h1>

        {/* Mensaje de estado */}
        {message && (
          <div className="mb-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-mono">
            {message}
          </div>
        )}

        {/* Botones de acción */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <button
            onClick={handleSeed}
            disabled={isLoading}
            className="flex items-center gap-2 p-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
          >
            <Sprout className="w-5 h-5" />
            Sembrar Datos
          </button>

          <button
            onClick={handleAddSeed}
            disabled={isLoading}
            className="flex items-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar Datos de Prueba
          </button>

          <button
            onClick={handleReset}
            disabled={isLoading}
            className="flex items-center gap-2 p-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Resetear DB
          </button>

          <button
            onClick={handleStats}
            disabled={isLoading}
            className="flex items-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            Ver Estadísticas
          </button>

          <button
            onClick={handleExport}
            disabled={isLoading}
            className="flex items-center gap-2 p-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar Backup
          </button>

          <label className="flex items-center gap-2 p-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            Importar Backup
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              disabled={isLoading}
            />
          </label>

        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Estadísticas de la Base de Datos
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.clients}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Clientes</div>
              </div>

              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.services}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Servicios</div>
              </div>

              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.totalAppointments}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Citas</div>
              </div>

              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.recurringAppointments}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Recurrentes</div>
              </div>

              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.exceptions}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Excepciones</div>
              </div>

              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stats.todayAppointments}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Hoy</div>
              </div>

              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.pendingToday}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Pendientes Hoy</div>
              </div>

              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {stats.doneToday}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Hechas Hoy</div>
              </div>
            </div>
          </div>
        )}

        {/* Indicador de carga */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-900 dark:text-white">Procesando...</span>
              </div>
            </div>
          </div>
        )}

        {/* Información de ayuda */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Datos de prueba incluidos:</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• 10 clientes con nombres y teléfonos argentinos</li>
            <li>• 6 servicios de barbería con precios realistas</li>
            <li>• Citas pasadas, presentes y futuras</li>
            <li>• Citas recurrentes (semanal, quincenal, mensual)</li>
            <li>• Excepciones (movimientos y saltos de citas)</li>
            <li>• Diferentes estados: pendiente, hecho, cancelado</li>
          </ul>
        </div>

        {/* Prueba de Tema
        <div className="mt-8">
          <ThemeTest />
        </div> */}
      </div>
    </div>
  );
}