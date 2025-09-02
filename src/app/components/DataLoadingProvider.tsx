'use client';

import React from 'react';
import { useData } from '../context/DataProvider';
import { useAuth } from '../context/AuthContext';

interface DataLoadingProviderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function DataLoadingProvider({ 
  children, 
  fallback = <DefaultLoadingFallback /> 
}: DataLoadingProviderProps) {
  const { loading, hasErrors, errors, retry, canRetry, isCoreDataReady } = useData();
  const { user, loading: authLoading } = useAuth();
  
  // 🎯 DEBUG: Pantalla de carga permanente para evaluar diseño
  // TODO: Quitar esto cuando termine el debugging
  // return <>{fallback}</>;
  
  // console.log('🔄 DataLoadingProvider: Estado actual:', {
  //   hasUser: !!user,
  //   authLoading,
  //   loadingCore: loading.core,
  //   hasErrors,
  //   isCoreDataReady,
  //   willShowLoading: loading.core || !isCoreDataReady,
  //   willShowError: hasErrors,
  //   willShowApp: !hasErrors && isCoreDataReady
  // });
  
  // 🎯 CONDICIÓN CRÍTICA: Si no está autenticado, mostrar la app normalmente
  // (el login se maneja en ProtectedRoute)
  if (!user && !authLoading) {
    // console.log('🔄 DataLoadingProvider: No hay usuario, mostrando app');
    return <>{children}</>;
  }

  // Si está cargando autenticación, mostrar loading
  if (authLoading) {
    // console.log('🔄 DataLoadingProvider: Auth loading, mostrando loading');
    return <>{fallback}</>;
  }

  // Si hay errores críticos, mostrar pantalla de error
  if (hasErrors) {
    // console.log('🔄 DataLoadingProvider: Hay errores, mostrando error screen');
    const criticalErrors = Object.entries(errors)
      .filter(([key, error]) => error && ['appointments', 'clients', 'services'].includes(key));
    
    const isCriticalError = criticalErrors.length > 0;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50">
        <div className="text-center p-8 max-w-md">
          {/* Icono de error */}
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-3">
            {isCriticalError ? 'Error crítico al cargar datos' : 'Error al cargar algunos datos'}
          </h2>
          <p className="text-slate-600 mb-6">
            {isCriticalError 
              ? 'No se pudieron cargar los datos principales de la aplicación'
              : 'Algunos datos no se pudieron cargar correctamente'
            }
          </p>
          
          {/* Debug Info - Solo en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h3 className="font-semibold text-amber-800 mb-2">Debug Info:</h3>
              <div className="text-sm text-amber-700 space-y-1">
                <div>hasErrors: {hasErrors.toString()}</div>
                <div>errorCount: {Object.values(errors).filter(e => e).length}</div>
                <div>errorKeys: {Object.entries(errors).filter(([_, error]) => error).map(([key, _]) => key).join(', ') || 'None'}</div>
                <div>isCoreDataReady: {isCoreDataReady.toString()}</div>
              </div>
            </div>
          )}
          
          {/* Mostrar errores específicos */}
          <div className="mb-6 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-slate-800 mb-2">Errores detectados:</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(errors)
                .filter(([_, error]) => error !== null && error !== undefined)
                .map(([key, error]) => (
                  <div key={key} className="text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                    <strong>{key}:</strong> {error?.message || 'Error desconocido'}
                  </div>
                ))}
              {Object.values(errors).filter(e => e).length === 0 && hasErrors && (
                <div className="text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <strong>⚠️ Contradicción:</strong> hasErrors=true pero errorCount=0
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => {
                window.location.reload();
              }}
              className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Recargar página
            </button>
            {canRetry && (
              <button 
                onClick={retry}
                className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Reintentar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Si los datos principales no están listos, mostrar loading
  if (loading.core || !isCoreDataReady) {
    // console.log('🔄 DataLoadingProvider: Core data loading, mostrando loading');
    return <>{fallback}</>;
  }

  // Todo listo, mostrar la aplicación
  // console.log('✅ DataLoadingProvider: All data ready, showing app');
  return <>{children}</>;
}

function DefaultLoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5dc',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        background: 'linear-gradient(135deg, #fefefe 0%, #f8f8f0 100%)',
        borderRadius: '24px',
        padding: '40px 30px',
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.15)',
        border: '2px solid rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        width: '90%',
        position: 'relative'
      }}>
        {/* Efecto de brillo sutil */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
          borderRadius: '24px 24px 0 0'
        }}></div>
        {/* Logo estático - TOMA TODO EL ESPACIO DISPONIBLE */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            width: '100%',
            height: '220px',
            margin: '0 auto'
          }}>
            <img 
              src="/assets/imgs/estudio_maker_black.PNG" 
              alt="Estudio Maker"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
        
        {/* Indicador de carga elegante - 3 puntos animados */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '8px',
          marginTop: '20px'
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#0ea5e9',
                borderRadius: '50%',
                animation: `bounce 1.4s ease-in-out infinite both`,
                animationDelay: `${i * 0.16}s`
              }}
            />
          ))}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
