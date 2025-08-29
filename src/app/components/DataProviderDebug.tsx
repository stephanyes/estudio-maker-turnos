'use client';

import React, { useState } from 'react';
import { useData } from '@/app/context/DataProvider';
import { Database, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function DataProviderDebug() {
  const [isOpen, setIsOpen] = useState(false);
  
  // 🎯 DataProvider para debugging
  const { 
    loading, 
    hasErrors, 
    errors, 
    isCoreDataReady,
    stats,
    retry,
    canRetry 
  } = useData();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200"
        title="DataProvider Debug"
      >
        <Database className="w-6 h-6" />
      </button>

      {/* Panel de debug */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-96 max-h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-white">🎯 DataProvider Debug</h3>
          </div>
          
          <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
            {/* Status General */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                🎯 Status General
                {isCoreDataReady ? (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">READY</span>
                ) : (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">LOADING</span>
                )}
              </h4>
              
              {/* Loading States */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 dark:text-blue-300">Core Data:</span>
                  <div className="flex items-center gap-2">
                    {loading.core ? <Clock className="w-4 h-4 text-yellow-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                    <span className={loading.core ? "text-yellow-600" : "text-green-600"}>
                      {loading.core ? "Loading" : "Ready"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 dark:text-blue-300">Staff Data:</span>
                  <div className="flex items-center gap-2">
                    {loading.staff ? <Clock className="w-4 h-4 text-yellow-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                    <span className={loading.staff ? "text-yellow-600" : "text-green-600"}>
                      {loading.staff ? "Loading" : "Ready"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 dark:text-blue-300">Realtime:</span>
                  <div className="flex items-center gap-2">
                    {loading.realtime ? <Clock className="w-4 h-4 text-yellow-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                    <span className={loading.realtime ? "text-yellow-600" : "text-green-600"}>
                      {loading.realtime ? "Loading" : "Ready"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 dark:text-blue-300">Analytics:</span>
                  <div className="flex items-center gap-2">
                    {loading.analytics ? <Clock className="w-4 h-4 text-yellow-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                    <span className={loading.analytics ? "text-yellow-600" : "text-green-600"}>
                      {loading.analytics ? "Loading" : "Ready"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error States */}
            {hasErrors && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Errors Detected
                </h4>
                <div className="text-xs text-red-700 dark:text-red-300 space-y-1">
                  {Object.entries(errors)
                    .filter(([_, error]) => error)
                    .map(([key, error]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-20 font-medium">{key}:</span>
                        <span className="flex-1">{error?.message || 'Unknown error'}</span>
                      </div>
                    ))}
                </div>
                {canRetry && (
                  <button
                    onClick={retry}
                    className="mt-3 w-full text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded transition-colors flex items-center gap-2 justify-center"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry Failed Queries
                  </button>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                📊 Data Counts
              </h4>
              <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <div className="flex justify-between">
                  <span>Today:</span>
                  <span className="font-medium">{stats?.today || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Week:</span>
                  <span className="font-medium">{stats?.week || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Month:</span>
                  <span className="font-medium">{stats?.month || 0}</span>
                </div>
              </div>
            </div>

            {/* Debug Info */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                🔍 Debug Info
              </h4>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>Core Ready: {isCoreDataReady ? 'Yes' : 'No'}</div>
                <div>Has Errors: {hasErrors ? 'Yes' : 'No'}</div>
                <div>Can Retry: {canRetry ? 'Yes' : 'No'}</div>
                <div>Any Loading: {loading.any ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
