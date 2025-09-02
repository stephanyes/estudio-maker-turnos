'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor } from 'lucide-react';

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Detectar si es iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Escuchar el evento beforeinstallprompt (solo funciona en Chrome/Edge)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar el prompt de instalación
    deferredPrompt.prompt();

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('Usuario aceptó instalar la PWA');
      setShowInstallButton(false);
    } else {
      console.log('Usuario rechazó instalar la PWA');
    }

    // Limpiar el prompt
    setDeferredPrompt(null);
  };

  const handleIOSInstall = () => {
    setShowIOSInstructions(!showIOSInstructions);
  };

  // Si es iOS, mostrar botón de instrucciones
  if (isIOS) {
    return (
      <>
        <button
          onClick={handleIOSInstall}
          className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
        >
          <Smartphone size={20} />
          <span className="hidden sm:inline">Instalar en iOS</span>
          <span className="sm:hidden">iOS</span>
        </button>

        {showIOSInstructions && (
          <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Smartphone size={32} className="text-white" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900">
                  Instalar en iPhone/iPad
                </h3>
                
                <div className="text-left space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <p>Toca el botón <strong>Compartir</strong> <span className="text-xs">(□↑)</span> en la barra inferior</p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <p>Selecciona <strong>"Añadir a pantalla de inicio"</strong></p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <p>Toca <strong>"Añadir"</strong> para confirmar</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Si no es iOS y no se puede instalar, no mostrar nada
  if (!showInstallButton) return null;

  // Botón normal para Chrome/Edge
  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
    >
      <Download size={20} />
      <span className="hidden sm:inline">Instalar App</span>
      <span className="sm:hidden">Instalar</span>
    </button>
  );
}
