import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Mantener compatibilidad con colores existentes
      }
    }
  },
  plugins: [],
};

export default config;