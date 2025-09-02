import Image from 'next/image';
import { useTheme } from 'next-themes';

interface LoadingSpinnerProps {
  message?: string;
  variant?: 'black' | 'white' | 'auto';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function LoadingSpinner({ 
  message = 'Cargando...', 
  variant = 'auto',
  size = 'medium',
  className = ''
}: LoadingSpinnerProps) {
  const { theme } = useTheme();
  
  // Determinar qué imagen usar basado en variant y tema
  const getImageSrc = () => {
    if (variant === 'black') return '/assets/imgs/loading_logo_black.PNG';
    if (variant === 'white') return '/assets/imgs/loading_logo_white.PNG';
    
    // Auto: usar blanco para modo oscuro, negro para modo claro
    return theme === 'dark' ? '/assets/imgs/loading_logo_white.PNG' : '/assets/imgs/loading_logo_black.PNG';
  };

  // Tamaños del spinner - LOGOS MÁS ALTOS Y PROPORCIONADOS
  const sizeClasses = {
    small: {
      container: 'min-h-[40vh]',
      image: 'w-full h-40',
      text: 'text-xs',
      gap: 'gap-2'
    },
    medium: {
      container: 'min-h-[60vh]',
      image: 'w-full h-52',
      text: 'text-sm',
      gap: 'gap-3'
    },
    large: {
      container: 'min-h-[80vh]',
      image: 'w-full h-64',
      text: 'text-base',
      gap: 'gap-4'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center justify-center ${currentSize.container} bg-[#f5f5dc] ${className}`}>
      <div className={`flex flex-col items-center justify-center ${currentSize.gap} text-center bg-gradient-to-br from-[#fefefe] to-[#f8f8f0] rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-black/10 max-w-lg w-11/12 relative`}>
        {/* Efecto de brillo sutil */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-t-3xl"></div>
        
        {/* Logo estático */}
                  <div className="relative mb-6">
            <div className={currentSize.image}>
            <Image
              src={getImageSrc()}
              alt="Estudio Maker"
              width={size === 'small' ? 160 : size === 'medium' ? 224 : 256}
              height={size === 'small' ? 160 : size === 'medium' ? 224 : 256}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        
        {/* Mensaje de carga */}
                  <span className={`text-gray-600 dark:text-gray-300 font-medium ${currentSize.text} md:text-base mb-4 text-center px-4`}>
          {message}
        </span>
        
        {/* Indicador de carga elegante - 3 puntos animados */}
        <div className="flex justify-center items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-[#0ea5e9] rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.16}s`,
                animationDuration: '1.4s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
