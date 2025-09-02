import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Detectar por ancho de pantalla
      const isMobileByWidth = window.innerWidth < 768;
      
      // Detectar por user agent
      const isMobileByAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      setIsMobile(isMobileByWidth || isMobileByAgent);
    };

    // Verificar al montar
    checkIsMobile();

    // Verificar al cambiar tamaño de ventana
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return isMobile;
}
