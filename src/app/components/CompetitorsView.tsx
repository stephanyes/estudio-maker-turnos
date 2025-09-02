'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

type PriceRow = {
  id?: string;
  source: 'cerini' | 'mala';
  service_name: string;
  category: string;
  price: number;
  currency: string;
  captured_at: string;
};

type PricesResponse = {
  cerini: PriceRow[];
  mala: PriceRow[];
};

type GroupedPrices = {
  [category: string]: PriceRow[];
};

export default function CompetitorsView() {
  const [data, setData] = useState<PricesResponse>({ cerini: [], mala: [] });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['corte', 'color', 'tratamientos', 'cauterizacion', 'peinado', 'otros']));

  const lastUpdated = useMemo(() => {
    const all = [...data.cerini, ...data.mala];
    if (all.length === 0) return null;
    const max = all.reduce((acc, row) => {
      const ts = new Date(row.captured_at).getTime();
      return ts > acc ? ts : acc;
    }, 0);
    return new Date(max).toLocaleString();
  }, [data]);

  const groupedCerini = useMemo(() => {
    return data.cerini.reduce((acc, item) => {
      const category = item.category || 'otros';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as GroupedPrices);
  }, [data.cerini]);

  const groupedMala = useMemo(() => {
    return data.mala.reduce((acc, item) => {
      const category = item.category || 'otros';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as GroupedPrices);
  }, [data.mala]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 🔐 OBTENER TOKEN DE AUTENTICACIÓN
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No hay sesión activa');
      }

      const res = await fetch('/api/competitors/prices', { 
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as PricesResponse;
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Error cargando precios');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      // 🔐 OBTENER TOKEN DE AUTENTICACIÓN
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No hay sesión activa');
      }

      const res = await fetch('/api/competitors/refresh', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Error al refrescar');
    } finally {
      setRefreshing(false);
    }
  }, [load, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const categoryLabels: Record<string, string> = {
    'corte': 'Cortes y Peinados',
    'color': 'Coloración',
    'tratamientos': 'Tratamientos',
    'peinado': 'Peinados',
    'cauterizacion': 'Cauterización',
    'otros': 'Otros Servicios'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Precios de Competencia</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={doRefresh}
            disabled={refreshing}
            className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            {refreshing ? 'Refrescando…' : 'Refrescar ahora'}
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div className="text-sm text-gray-600">Última actualización: {lastUpdated}</div>
      )}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <CompetitorSection 
          title="Cerini" 
          groupedData={groupedCerini} 
          loading={loading}
          expandedCategories={expandedCategories}
          onToggleCategory={toggleCategory}
          categoryLabels={categoryLabels}
        />
        <CompetitorSection 
          title="Mala Peluquería" 
          groupedData={groupedMala} 
          loading={loading}
          expandedCategories={expandedCategories}
          onToggleCategory={toggleCategory}
          categoryLabels={categoryLabels}
        />
      </div>
    </div>
  );
}

function CompetitorSection({ 
  title, 
  groupedData, 
  loading, 
  expandedCategories, 
  onToggleCategory,
  categoryLabels 
}: { 
  title: string; 
  groupedData: GroupedPrices; 
  loading: boolean;
  expandedCategories: Set<string>;
  onToggleCategory: (category: string) => void;
  categoryLabels: Record<string, string>;
}) {
  const categories = Object.keys(groupedData).sort();
  const totalServices = Object.values(groupedData).reduce((sum, items) => sum + items.length, 0);

  if (loading && totalServices === 0) {
    return (
      <div className="border rounded">
        <div className="p-3 border-b font-medium">{title}</div>
        <div className="p-3">
          <div className="text-sm text-gray-500">Cargando…</div>
        </div>
      </div>
    );
  }

  if (totalServices === 0) {
    return (
      <div className="border rounded">
        <div className="p-3 border-b font-medium">{title}</div>
        <div className="p-3">
          <div className="text-sm text-gray-500">Sin datos</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded">
      <div className="p-3 border-b font-medium">
        {title} ({totalServices} servicios)
      </div>
      <div className="p-3 space-y-3">
        {categories.map(category => {
          const items = groupedData[category];
          const isExpanded = expandedCategories.has(category);
          const categoryLabel = categoryLabels[category] || category;

          return (
            <div key={category} className="border rounded">
              <button
                onClick={() => onToggleCategory(category)}
                className="w-full p-2 text-left bg-gray-50 hover:bg-gray-100 flex items-center justify-between"
              >
                <span className="font-medium capitalize">{categoryLabel}</span>
                <span className="text-sm text-gray-500">
                  {items.length} servicio{items.length !== 1 ? 's' : ''}
                </span>
                <span className="text-gray-400">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>
              
              {isExpanded && (
                <div className="p-3 border-t">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="py-1 pr-2">Servicio</th>
                          <th className="py-1 pr-2 whitespace-nowrap">Precio</th>
                          <th className="py-1 pr-2 whitespace-nowrap">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => (
                          <tr key={item.id ?? `${item.source}-${i}`} className="border-t">
                            <td className="py-1 pr-2 max-w-[200px] lg:max-w-none">
                              <div className="truncate" title={item.service_name}>
                                {item.service_name}
                              </div>
                            </td>
                            <td className="py-1 pr-2 whitespace-nowrap">{item.currency} {item.price.toLocaleString()}</td>
                            <td className="py-1 pr-2 whitespace-nowrap text-xs lg:text-sm">
                              {new Date(item.captured_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
