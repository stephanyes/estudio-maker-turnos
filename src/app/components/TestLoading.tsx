'use client';

export default function TestLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center space-y-6">
        {/* Logo/Icono animado */}
        <div className="relative">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl shadow-lg flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-sky-600">S</span>
            </div>
          </div>
          {/* Anillo de carga */}
          <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-sky-200 border-t-sky-500 rounded-2xl animate-spin"></div>
        </div>
        
        {/* Texto principal */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
            Estudio Maker
          </h1>
          <p className="text-slate-600 font-medium">Cargando...</p>
        </div>
        
        {/* Indicador de progreso */}
        <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
