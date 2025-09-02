import * as cheerio from 'cheerio';
import { computeContentHash, fetchWithCacheHeaders, parseCurrencyToNumber } from './utils';
import { categorizeService, normalizeServiceName } from './normalize';
import type { CompetitorPriceRecord, ScrapeResult } from './types';

const CERINI_URL = 'https://cerini.net/servicios/';

// Categoría compartida en normalize.ts

export async function scrapeCerini(prior?: { etag?: string | null; lastModified?: string | null; contentHash?: string | null }): Promise<ScrapeResult> {
  const res = await fetchWithCacheHeaders({ url: CERINI_URL, prior });

  // If not modified and we have a prior contentHash, we can early-return an empty items list
  if (res.status === 304) {
    return {
      source: 'cerini',
      meta: {
        url: CERINI_URL,
        etag: res.etag ?? undefined,
        lastModified: res.lastModified ?? undefined,
        contentHash: prior?.contentHash ?? undefined,
        fetchedAt: new Date().toISOString(),
        usedCache: true,
      },
      items: [],
    };
  }

  const html = res.html ?? '';
  const $ = cheerio.load(html);

  const items: CompetitorPriceRecord[] = [];

  // Heurística: buscar listas o tarjetas con servicio y precio
  $("*:contains('$')").each((_, el) => {
    const text = $(el).text().trim();
    // capturar líneas con servicio + precio, p.ej: "Corte Caballero $20.000"
    const match = text.match(/(.{3,100}?)\s*\$\s*([\d\.,]+)/);
    if (match) {
      const serviceName = normalizeServiceName(match[1]);
      const priceValue = parseCurrencyToNumber(match[2]);
      if (serviceName && priceValue > 0) {
        items.push({
          source: 'cerini',
          serviceName,
          category: categorizeService(serviceName),
          price: priceValue,
          currency: 'ARS',
          capturedAt: new Date().toISOString(),
        });
      }
    }
  });

  const metaHash = res.contentHash ?? computeContentHash(html);

  return {
    source: 'cerini',
    meta: {
      url: CERINI_URL,
      etag: res.etag ?? undefined,
      lastModified: res.lastModified ?? undefined,
      contentHash: metaHash,
      fetchedAt: new Date().toISOString(),
      usedCache: false,
    },
    items,
  };
}


