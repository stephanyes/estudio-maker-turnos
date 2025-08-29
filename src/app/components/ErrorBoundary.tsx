'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Aquí podrías enviar el error a un servicio de logging
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl space-y-4 w-full max-w-md">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Algo salió mal
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Ha ocurrido un error inesperado. Por favor, recarga la página.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500"
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para manejar errores en componentes funcionales
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);
    
    // Aquí podrías enviar el error a un servicio de logging
    // logErrorToService(error, { context });
    
    // Mostrar notificación al usuario
    if (typeof window !== 'undefined') {
      // Usar una librería de notificaciones o alert básico
      alert(`Error: ${error.message}`);
    }
  };

  return { handleError };
}
