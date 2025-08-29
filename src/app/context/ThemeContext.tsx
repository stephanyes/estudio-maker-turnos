// 'use client';
// import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// type Theme = 'light' | 'dark';

// interface ThemeContextProps {
//   theme: Theme;
//   toggleTheme: () => void;
// }

// const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

// export function ThemeProvider({ children }: { children: ReactNode }) {
//   const [theme, setTheme] = useState<Theme>('light');

//   const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

//   return (
//     <ThemeContext.Provider value={{ theme, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// }

// export function useTheme() {
//   const context = useContext(ThemeContext);
//   if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider');
//   return context;
// }
