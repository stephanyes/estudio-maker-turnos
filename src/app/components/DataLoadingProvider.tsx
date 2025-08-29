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
  
  // 🧪 TEMPORAL: Forzar pantalla de carga para testing
  // const forceLoading = true;
  // if (forceLoading) {
  //   console.log('🧪 Forzando pantalla de carga para testing');
  //   return <DefaultLoadingFallback />;
  // }
  
  // 🎯 CONDICIÓN CRÍTICA: Si no está autenticado, mostrar la app normalmente
  // (el login se maneja en ProtectedRoute)
  if (!user && !authLoading) {
    return <>{children}</>;
  }

  // Logging para debug con lógica corregida
  const errorCount = Object.values(errors).filter(e => e !== null && e !== undefined).length;
  const errorKeys = Object.entries(errors)
    .filter(([_, error]) => error !== null && error !== undefined)
    .map(([key, _]) => key);
  
  // console.log('🔍 DataLoadingProvider State:', {
  //   loading,
  //   hasErrors,
  //   isCoreDataReady,
  //   errorCount,
  //   errorKeys,
  //   user,
  //   authLoading,
  //   willShowLoading: loading.core || !isCoreDataReady,
  //   willShowApp: !hasErrors && isCoreDataReady
  // });

  // Logging para detectar cambios de estado
  // console.log('🔍 DataLoadingProvider Render:', {
  //   hasErrors,
  //   isCoreDataReady,
  //   willShowError: hasErrors,
  //   willShowLoading: loading.core || !isCoreDataReady,
  //   willShowApp: !hasErrors && isCoreDataReady
  // });

  // Si hay errores críticos, mostrar pantalla de error
  if (hasErrors) {
    const criticalErrors = Object.entries(errors)
      .filter(([key, error]) => error && ['appointments', 'clients', 'services'].includes(key));
    
    const isCriticalError = criticalErrors.length > 0;
    
    // console.log('🚨 DataLoadingProvider Error State:', {
    //   hasErrors,
    //   isCriticalError,
    //   criticalErrors: criticalErrors.map(([key, error]) => `${key}: ${error?.message}`),
    //   allErrors: Object.entries(errors)
    //     .filter(([_, error]) => error)
    //     .map(([key, error]) => `${key}: ${error?.message}`)
    // });

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
    return <>{fallback}</>;
  }

  // Si hay datos principales pero otros están cargando, mostrar loading parcial
  if (loading.any && !loading.core) {
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
            padding: '48px',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.15)',
            border: '2px solid rgba(0, 0, 0, 0.1)',
            maxWidth: '420px',
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
            {/* Logo más pequeño */}
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                margin: '0 auto',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                borderRadius: '12px',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#0ea5e9'
                  }}>S</span>
                </div>
              </div>
              {/* Anillo de carga más sutil */}
              <div style={{
                position: 'absolute',
                inset: '0',
                width: '64px',
                height: '64px',
                margin: '0 auto',
                border: '3px solid #e0f2fe',
                borderTop: '3px solid #0ea5e9',
                borderRadius: '12px',
                animation: 'spin 1s linear infinite'
              }}></div>
            </div>
            
            {/* Texto principal */}
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Datos principales listos
              </h2>
              <p style={{
                color: '#475569',
                fontWeight: '500',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                Cargando datos adicionales...
              </p>
            </div>
            
            {/* Lista de elementos cargando */}
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              {loading.staff && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px', width: '100%' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#0ea5e9',
                    borderRadius: '50%',
                    animation: 'pulse 2s ease-in-out infinite',
                    flexShrink: 0
                  }}></div>
                  <span style={{ fontSize: '14px', color: '#64748b', textAlign: 'center' }}>Cargando empleados...</span>
                </div>
              )}
              {loading.realtime && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px', width: '100%' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#0ea5e9',
                    borderRadius: '50%',
                    animation: 'pulse 2s ease-in-out infinite',
                    flexShrink: 0
                  }}></div>
                  <span style={{ fontSize: '14px', color: '#64748b', textAlign: 'center' }}>Cargando datos en tiempo real...</span>
                </div>
              )}
              {loading.analytics && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px', width: '100%' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#0ea5e9',
                    borderRadius: '50%',
                    animation: 'pulse 2s ease-in-out infinite',
                    flexShrink: 0
                  }}></div>
                  <span style={{ fontSize: '14px', color: '#64748b', textAlign: 'center' }}>Cargando estadísticas...</span>
                </div>
              )}
            </div>
            
            {/* Indicador de progreso */}
            <div style={{
              width: '160px',
              height: '4px',
              backgroundColor: '#e2e8f0',
              borderRadius: '4px',
              overflow: 'hidden',
              margin: '0 auto'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #0ea5e9 0%, #2563eb 100%)',
                borderRadius: '4px',
                animation: 'pulse 2s ease-in-out infinite'
              }}></div>
            </div>
          </div>
        </div>
      );
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
        padding: '48px',
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.15)',
        border: '2px solid rgba(0, 0, 0, 0.1)',
        maxWidth: '420px',
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
        {/* Logo/Icono animado */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'white',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#0ea5e9'
              }}>S</span>
            </div>
          </div>
          {/* Anillo de carga */}
          <div style={{
            position: 'absolute',
            inset: '0',
            width: '80px',
            height: '80px',
            margin: '0 auto',
            border: '4px solid #e0f2fe',
            borderTop: '4px solid #0ea5e9',
            borderRadius: '16px',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
        
        {/* Texto principal */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            Estudio Maker
          </h1>
          <p style={{
            color: '#475569',
            fontWeight: '500',
            fontSize: '16px'
          }}>
            Cargando...
          </p>
        </div>
        
        {/* Indicador de progreso */}
        <div style={{
          width: '192px',
          height: '4px',
          backgroundColor: '#e2e8f0',
          borderRadius: '4px',
          overflow: 'hidden',
          margin: '0 auto'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #0ea5e9 0%, #2563eb 100%)',
            borderRadius: '4px',
            animation: 'pulse 2s ease-in-out infinite'
          }}></div>
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
      `}</style>
    </div>
  );
}
