// 'use client';
// import { useTheme } from '../context/ThemeContext';

// export default function ThemeTest() {
//   const { theme, toggleTheme } = useTheme();

//   return (
//     <div className="p-6 space-y-6 bg-white border-2 border-zinc-200 rounded-lg">
//       <h3 className="text-xl font-bold text-zinc-900">
//         🎨 Prueba de Tema Dark/Light
//       </h3>
      
//       <div className="space-y-4">
//         <div className="flex items-center gap-4">
//           <p className="text-zinc-700">
//             Tema actual: <span className="font-mono bg-zinc-100 px-3 py-1 rounded text-zinc-900">{theme}</span>
//           </p>
          
//           <button
//             onClick={toggleTheme}
//             className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors font-medium"
//           >
//             {theme === 'dark' ? '☀️ Cambiar a Claro' : '🌙 Cambiar a Oscuro'}
//           </button>
//         </div>
        
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="p-4 bg-zinc-100 rounded-lg border border-zinc-200">
//             <p className="text-zinc-900 font-medium">Fondo Gris</p>
//             <p className="text-zinc-600 text-sm">bg-zinc-100</p>
//           </div>
          
//           <div className="p-4 bg-white rounded-lg border-2 border-zinc-200">
//             <p className="text-zinc-900 font-medium">Fondo Blanco</p>
//             <p className="text-zinc-600 text-sm">bg-white</p>
//           </div>
          
//           <div className="p-4 bg-sky-50 rounded-lg border border-sky-200">
//             <p className="text-sky-900 font-medium">Fondo Azul</p>
//             <p className="text-sky-700 text-sm">bg-sky-50</p>
//           </div>
//         </div>
        
//         <div className="p-4 bg-green-50 rounded-lg border border-green-200">
//           <p className="text-green-900 font-medium">✅ Tailwind restaurado - listo para dark mode</p>
//           <p className="text-green-700 text-sm">bg-green-50</p>
//         </div>
//       </div>
//     </div>
//   );
// }
