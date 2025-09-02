'use client';

import React from 'react';
import { useData } from '../context/DataProvider';
import { useAuth } from '../context/AuthContext';

export default function DataProviderDebug() {
  const { loading, hasErrors, errors, isCoreDataReady } = useData();
  const { user, userProfile, loading: authLoading } = useAuth();

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
      <div className="font-bold mb-2">🔍 Debug Info</div>
      
      {/* Auth State */}
      <div className="mb-2">
        <div className="text-cyan-400">Auth:</div>
        <div>User: {user ? '✅' : '❌'}</div>
        <div>Profile: {userProfile ? '✅' : '❌'}</div>
        <div>Loading: {authLoading ? '🔄' : '✅'}</div>
      </div>

      {/* Data Loading State */}
      <div className="mb-2">
        <div className="text-green-400">Data Loading:</div>
        <div>Core: {loading.core ? '🔄' : '✅'}</div>
        <div>Staff: {loading.staff ? '🔄' : '✅'}</div>
        <div>Realtime: {loading.realtime ? '🔄' : '✅'}</div>
        <div>Analytics: {loading.analytics ? '🔄' : '✅'}</div>
        <div>Any: {loading.any ? '🔄' : '✅'}</div>
      </div>

      {/* Core Data Ready */}
      <div className="mb-2">
        <div className="text-yellow-400">Core Data:</div>
        <div>Ready: {isCoreDataReady ? '✅' : '❌'}</div>
      </div>

      {/* Errors */}
      {hasErrors && (
        <div className="mb-2">
          <div className="text-red-400">Errors:</div>
          {Object.entries(errors)
            .filter(([_, error]) => error)
            .map(([key, error]) => (
              <div key={key} className="text-red-300">
                {key}: {error?.message || 'Unknown'}
              </div>
            ))}
        </div>
      )}

      {/* Timestamp */}
      <div className="text-gray-400 text-xs">
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
