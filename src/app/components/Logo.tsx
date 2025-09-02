import Image from 'next/image';
import { useTheme } from 'next-themes';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  variant?: 'auto' | 'black' | 'white';
}

export default function Logo({ 
  size = 'medium', 
  className = '',
  variant = 'auto'
}: LogoProps) {
  const { theme } = useTheme();
  
  // Determinar qué imagen usar basado en variant y tema
  const getImageSrc = () => {
    if (variant === 'black') return '/assets/imgs/estudio_maker_black.PNG';
    if (variant === 'white') return '/assets/imgs/estudio_maker_white.PNG';
    
    // Auto: usar blanco para modo oscuro, negro para modo claro
    return theme === 'dark' ? '/assets/imgs/estudio_maker_white.PNG' : '/assets/imgs/estudio_maker_black.PNG';
  };

  // Tamaños del logo
  const sizeClasses = {
    small: {
      width: 32,
      height: 32,
      className: 'w-8 h-8'
    },
    medium: {
      width: 48,
      height: 48,
      className: 'w-12 h-12'
    },
    large: {
      width: 64,
      height: 64,
      className: 'w-16 h-16'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center justify-center ${currentSize.className} ${className}`}>
      <Image
        src={getImageSrc()}
        alt="Estudio Maker"
        width={currentSize.width}
        height={currentSize.height}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
}
