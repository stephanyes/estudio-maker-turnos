import { computeContentHash, parseCurrencyToNumber } from './utils';
import { categorizeService, normalizeServiceName } from './normalize';
import type { CompetitorPriceRecord, ScrapeResult } from './types';
import { writeDebugText } from './fs-debug';
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const LIST_PAGE_URL = 'https://www.malapeluqueria.com/lista-de-precios';
const DIRECT_PDF_URL = 'https://www.malapeluqueria.com/_files/ugd/7ac9db_5def412290b44acab1a1eafb4f64e972.pdf';

async function fetchWithHeaders(url: string, prior?: { etag?: string | null; lastModified?: string | null }) {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (compatible; EstudioMakerBot/1.0)'
  };
  if (prior?.etag) headers['If-None-Match'] = String(prior.etag);
  if (prior?.lastModified) headers['If-Modified-Since'] = String(prior.lastModified);
  const res = await fetch(url, { headers });
  return res;
}

async function resolvePdfUrl(): Promise<string> {
  // La página genera/embebe un PDF; intentamos encontrar un enlace directo a .pdf
  // Usar la URL directa provista; si falla, intentar resolver desde la página
  try {
    const head = await fetch(DIRECT_PDF_URL, { method: 'HEAD' });
    const type = head.headers.get('content-type') || '';
    if (head.ok && type.includes('pdf')) return DIRECT_PDF_URL;
  } catch {}
  const res = await fetch(LIST_PAGE_URL).catch(() => null);
  const html = await res?.text().catch(() => '') || '';
  const m = html.match(/href\s*=\s*"([^"]+\.pdf)"/i) || html.match(/src\s*=\s*"([^"]+\.pdf)"/i);
  if (m && m[1]) return m[1].startsWith('http') ? m[1] : new URL(m[1], LIST_PAGE_URL).toString();
  return DIRECT_PDF_URL; // último intento
}

export async function scrapeMala(
  prior?: { etag?: string | null; lastModified?: string | null; contentHash?: string | null }
): Promise<ScrapeResult> {
  const pdfUrl = await resolvePdfUrl();
  const res = await fetchWithHeaders(pdfUrl, prior);
  const contentType = res.headers.get('content-type') || '';

  if (res.status === 304) {
    return {
      source: 'mala',
      meta: {
        url: pdfUrl,
        etag: res.headers.get('etag') ?? undefined,
        lastModified: res.headers.get('last-modified') ?? undefined,
        contentHash: prior?.contentHash ?? undefined,
        fetchedAt: new Date().toISOString(),
        usedCache: true,
      },
      items: [],
    };
  }

  // Asegurar que estamos descargando PDF; si no, intentar resolver nuevamente o abortar
  if (!contentType.includes('pdf')) {
    // si no es PDF, intentar obtener desde página base un nuevo enlace
    const retryUrl = await resolvePdfUrl();
    if (retryUrl !== pdfUrl) {
      const retryRes = await fetchWithHeaders(retryUrl, prior);
      if (!retryRes.ok) throw new Error(`No se pudo obtener PDF: HTTP ${retryRes.status}`);
      const retryType = retryRes.headers.get('content-type') || '';
      if (!retryType.includes('pdf')) throw new Error('Contenido no es PDF');
      const retryBuffer = Buffer.from(await retryRes.arrayBuffer());
      const textRetry = await extractPdfText(retryBuffer);
      const debugPath = await writeDebugText(`mala-${Date.now()}.txt`, textRetry.slice(0, 200000));
      return buildResultFromText(textRetry, retryUrl, retryRes, computeContentHash(retryBuffer.toString('binary')), debugPath);
    }
    throw new Error('Contenido no es PDF');
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentHash = computeContentHash(buffer.toString('binary'));

  // parse PDF -> text
  const text = await extractPdfText(buffer);
  const debugPath = await writeDebugText(`mala-${Date.now()}.txt`, text.slice(0, 200000));
  return buildResultFromText(text, pdfUrl, res, contentHash, debugPath);
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Use pdftotext subprocess for reliable text extraction
    const tempPath = join(process.cwd(), `temp-pdf-${Date.now()}.pdf`);
    
    try {
      // Write buffer to temp file
      writeFileSync(tempPath, buffer);
      
      // Extract text using pdftotext
      const text = execSync(`pdftotext "${tempPath}" -`, { encoding: 'utf8' });
      
      return text || '';
    } finally {
      // Clean up temp file
      try {
        unlinkSync(tempPath);
      } catch {}
    }
  } catch (error) {
    console.error('PDF extraction failed:', error);
    // Return empty string if extraction fails
    return '';
  }
}

function buildResultFromText(text: string, url: string, res: Response, contentHash: string, debugPath?: string): ScrapeResult {
  const items: CompetitorPriceRecord[] = [];
  const lines = text.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
  
  let currentCategory: 'corte' | 'color' | 'cauterizacion' | 'peinado' | 'tratamientos' | 'otros' = 'otros';
  
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1];
    
    // Check if current line is a main category header
    if (currentLine.endsWith(':') && currentLine.length > 3) {
      const categoryMatch = currentLine.match(/^([^:]+):$/);
      if (categoryMatch) {
        const categoryName = categoryMatch[1].trim();
        // Map PDF categories to our internal categories
        if (categoryName.includes('CORTE') || categoryName.includes('PEINADOS')) {
          currentCategory = 'corte';
        } else if (categoryName.includes('TRATAMIENTOS')) {
          currentCategory = 'tratamientos';
        } else if (categoryName.includes('LAVADOS')) {
          currentCategory = 'otros';
        } else if (categoryName.includes('EXTENSIONES')) {
          currentCategory = 'otros';
        } else if (categoryName.includes('COLORACIÓN')) {
          currentCategory = 'color';
        } else if (categoryName.includes('DECOLORACIÓN')) {
          currentCategory = 'color';
        } else if (categoryName.includes('MAQUILLAJE')) {
          currentCategory = 'otros';
        } else {
          currentCategory = 'otros';
        }
        continue; // Skip to next line
      }
    }
    
    // Check if current line is a service name and next line is a price
    const priceMatch = nextLine.match(/^\$\s*([\d\.,]+)$/);
    if (priceMatch && currentLine && !currentLine.includes('$') && !currentLine.includes(':') && currentLine.length > 2) {
      const serviceName = normalizeServiceName(currentLine);
      const priceValue = parseCurrencyToNumber(priceMatch[1]);
      
      if (serviceName && priceValue > 0) {
        items.push({
          source: 'mala',
          serviceName,
          category: currentCategory,
          price: priceValue,
          currency: 'ARS',
          capturedAt: new Date().toISOString(),
        });
        i++; // Skip the price line since we processed it
      }
    }
  }

  return {
    source: 'mala',
    meta: {
      url,
      etag: res.headers.get('etag') ?? undefined,
      lastModified: res.headers.get('last-modified') ?? undefined,
      contentHash,
      fetchedAt: new Date().toISOString(),
      usedCache: false,
      debugPath,
    },
    items,
  };
}


