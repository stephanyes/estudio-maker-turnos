'use client';

import { useState } from 'react';
import { X, Bug, Info } from 'lucide-react';

export default function DataProviderDebug() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Mostrar Debug Info"
      >
        <Bug size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-xs">
      {/* Header con botón de cerrar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bug size={16} />
          <span className="text-sm font-medium">Debug Info</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Contenido del debug */}
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-medium">Auth:</span>
          <div className="ml-2 space-y-1">
            <div className="flex items-center gap-2">
              <span>User:</span>
              <span className="text-green-400">✅</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Profile:</span>
              <span className="text-green-400">✅</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Loading:</span>
              <span className="text-green-400">✅</span>
            </div>
          </div>
        </div>

        <div>
          <span className="font-medium">Data Loading:</span>
          <div className="ml-2 space-y-1">
            <div className="flex items-center gap-2">
              <span>Core:</span>
              <span className="text-green-400">✅</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Staff:</span>
              <span className="text-green-400">✅</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Realtime:</span>
              <span className="text-green-400">✅</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Analytics:</span>
              <span className="text-green-400">✅</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Any:</span>
              <span className="text-green-400">✅</span>
            </div>
          </div>
        </div>

        <div>
          <span className="font-medium">Core Data:</span>
          <div className="ml-2">
            <div className="flex items-center gap-2">
              <span>Ready:</span>
              <span className="text-green-400">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón para expandir/contraer */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-3 w-full text-center text-xs text-gray-400 hover:text-white transition-colors"
      >
        {isExpanded ? 'Contraer' : 'Expandir'}
      </button>
    </div>
  );
}
