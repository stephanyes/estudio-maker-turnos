import { SupabaseClient } from '@supabase/supabase-js';
import type { CompetitorPriceRecord, CompetitorSource } from './types';

export async function insertPrices(supabase: SupabaseClient, records: CompetitorPriceRecord[]) {
  if (records.length === 0) return { inserted: 0 };
  // De-duplicar por clave (source + service_name + price)
  const seen = new Set<string>();
  const rows = records.filter(r => {
    const key = `${r.source}::${r.serviceName}::${r.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(r => ({
    source: r.source,
    service_name: r.serviceName,
    category: r.category,
    price: r.price,
    currency: r.currency,
    observations: r.observations ?? null,
    content_hash: r.contentHash ?? null,
    captured_at: r.capturedAt,
    metadata: r.metadata ?? {},
  }));
  // Upsert para evitar errores por índice único (source, service_name, content_hash)
  const { error } = await supabase
    .from('competitor_prices')
    .upsert(rows, { onConflict: 'source,service_name,content_hash', ignoreDuplicates: true });
  if (error) throw error;
  return { inserted: rows.length };
}

export async function getLatestBySource(supabase: SupabaseClient, source: CompetitorSource) {
  const { data, error } = await supabase
    .from('competitor_prices')
    .select('*')
    .eq('source', source)
    .order('captured_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function getLastScrapeRun(supabase: SupabaseClient, source: CompetitorSource) {
  const { data, error } = await supabase
    .from('scrape_runs')
    .select('*')
    .eq('source', source)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function createScrapeRun(
  supabase: SupabaseClient,
  source: CompetitorSource,
  lockMinutes: number
) {
  const lockExpiresAt = new Date(Date.now() + lockMinutes * 60_000).toISOString();
  const { data, error } = await supabase
    .from('scrape_runs')
    .insert([{ source, status: 'running', lock_expires_at: lockExpiresAt }])
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function finishScrapeRun(supabase: SupabaseClient, id: string, status: 'success' | 'failed' | 'skipped', result?: any, errorMsg?: string) {
  const { error } = await supabase
    .from('scrape_runs')
    .update({ status, finished_at: new Date().toISOString(), result: result ?? {}, error: errorMsg ?? null })
    .eq('id', id);
  if (error) throw error;
}


