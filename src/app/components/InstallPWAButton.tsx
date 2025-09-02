'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Escuchar el evento beforeinstallprompt
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

  if (!showInstallButton) return null;

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
